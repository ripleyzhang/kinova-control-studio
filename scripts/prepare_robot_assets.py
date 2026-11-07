"""Prepare the pinned official model; run with a Python environment containing xacro==2.1.1."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
REVISION = 'b2aa46b29ae8fadd5b293c57e3500925c61eb8e8'
PUBLIC = ROOT / 'apps/web/public/robots/gen3-lite'
SOURCE = ROOT / 'packages/robot-description'
ENTRY = 'robots/gen3_lite_gen3_lite_2f.xacro'
ARM = 'arms/gen3_lite/6dof/urdf/gen3_lite_macro.xacro'
FILES = [ENTRY, 'robots/kortex_robot.xacro', ARM,
         'arms/gen3_lite/6dof/urdf/kortex.ros2_control.xacro',
         'grippers/gen3_lite_2f/urdf/gen3_lite_2f_macro.xacro',
         'grippers/gen3_lite_2f/urdf/gen3_lite_2f.ros2_control.xacro', 'package.xml']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate():
    raw = (PUBLIC / 'robot.urdf').read_text()
    assert all(token not in raw for token in ['package://', 'file://', '${', '$(', 'xacro:'])
    robot = ET.fromstring(raw)
    joints = robot.findall('joint')
    links = {link.get('name') for link in robot.findall('link')}
    assert len(links) == len(robot.findall('link'))
    assert len({j.get('name') for j in joints}) == len(joints)
    children = [j.find('child').get('link') for j in joints]
    assert len(set(children)) == len(children)
    assert links - set(children) == {'world'}
    reachable = {'world'}
    while True:
        expanded = reachable | {j.find('child').get('link') for j in joints
                                if j.find('parent').get('link') in reachable}
        if expanded == reachable:
            break
        reachable = expanded
    assert reachable == links and len(joints) == len(links) - 1
    arm = [j for j in joints if j.get('name') in [f'joint_{i}' for i in range(1, 7)]]
    assert len(arm) == 6 and all(j.get('type') == 'revolute' for j in arm)
    original = ET.parse(SOURCE / 'expanded.urdf').getroot()
    def structure(element):
        return element.tag, element.attrib, (element.text or '').strip(), [structure(c) for c in element]
    assert [structure(j) for j in joints] == [structure(j) for j in original.findall('joint')]
    for link in robot.findall('link'):
        source_link = original.find(f"link[@name='{link.get('name')}']")
        # Mesh URI rewriting is the only permitted difference within links.
        for mesh in source_link.findall('.//mesh'):
            mesh.set('filename', mesh.get('filename').replace('package://kortex_description/', '/robots/gen3-lite/meshes/'))
        assert structure(link) == structure(source_link)
    for j in arm:
        assert j.find('axis') is not None
        limit = j.find('limit')
        assert all(math.isfinite(float(limit.get(key))) for key in ['lower', 'upper', 'effort', 'velocity'])
        assert float(limit.get('lower')) <= 0 <= float(limit.get('upper'))
    meshes = robot.findall('.//mesh')
    for mesh in meshes:
        uri = mesh.get('filename')
        assert uri.startswith('/robots/gen3-lite/meshes/')
        path = ROOT / 'apps/web/public' / uri.lstrip('/')
        data = path.read_bytes()
        # Official STL assets are binary: count must match the triangle records.
        assert len(data) >= 84
        assert len(data) == 84 + 50 * int.from_bytes(data[80:84], 'little')
    manifest = json.loads((PUBLIC / 'provenance.json').read_text())
    for item in manifest['meshes']:
        assert digest(PUBLIC / item['local']) == item['sha256']
    assert not robot.findall('ros2_control') and not robot.findall('gazebo')
    print(f'PASS: {len(links)} links, {len(joints)} joints, 6 arm joints; '
          f'{len(robot.findall(".//visual/geometry/mesh"))} visual mesh references; '
          f'{len(set(m.get("filename") for m in meshes))} unique STL assets; hierarchy and hashes valid.')


def prepare(checkout):
    assert subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', 'HEAD'], text=True).strip() == REVISION
    official = checkout / 'kortex_description'
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for relative in FILES:
        target = SOURCE / 'upstream/kortex_description' / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(official / relative, target)
    for target in [SOURCE / 'LICENSE', PUBLIC / 'LICENSE']:
        shutil.copy2(checkout / 'LICENSE', target)
    with tempfile.TemporaryDirectory() as temp:
        staged = Path(temp) / 'kortex_description'
        shutil.copytree(SOURCE / 'upstream/kortex_description', staged)
        for path in staged.rglob('*.xacro'):
            path.write_text(path.read_text().replace('$(find kortex_description)', str(staged)))
        wrapper = staged / 'robots/kortex_robot.xacro'
        text = wrapper.read_text()
        unused = '      gripper="${gripper}"\n'
        assert text.count(unused) == 1
        wrapper.write_text(text.replace(unused, ''))
        import xacro
        doc = xacro.process_file(str(staged / ENTRY))
        # Normalize temporary paths for reproducible source URIs and comments.
        expanded = doc.toprettyxml(indent='  ').replace(str(staged), 'package://kortex_description')
        expanded = expanded.replace('file://package://', 'package://')
        (SOURCE / 'expanded.urdf').write_text(expanded)
    robot = ET.fromstring(expanded)
    # Keep links/joints intact; ROS/Gazebo execution metadata is outside frontend V1.
    for element in list(robot):
        if element.tag not in ('link', 'joint', 'material'):
            robot.remove(element)
    assets = {}
    for mesh in robot.findall('.//mesh'):
        uri = mesh.get('filename')
        prefix = 'package://kortex_description/'
        assert uri.startswith(prefix), uri
        relative = Path(uri[len(prefix):])
        local = Path('meshes') / relative
        target = PUBLIC / local
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(official / relative, target)
        assert digest(target) == digest(official / relative)
        mesh.set('filename', '/robots/gen3-lite/' + local.as_posix())
        assets[uri] = {'source': 'kortex_description/' + relative.as_posix(),
                       'local': local.as_posix(), 'sha256': digest(target)}
    ET.indent(robot)
    ET.ElementTree(robot).write(PUBLIC / 'robot.urdf', encoding='utf-8', xml_declaration=True)
    (PUBLIC / 'provenance.json').write_text(json.dumps({
        'repository': 'https://github.com/Kinovarobotics/ros2_kortex',
        'revision': REVISION, 'entry': 'kortex_description/' + ENTRY,
        'variant': 'gen3_lite / 6dof / gen3_lite_2f / empty prefix / no vision',
        'xacro_version': '2.1.1', 'license': 'BSD (see verbatim LICENSE)',
        'meshes': list(assets.values())}, indent=2) + '\n')
    validate()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='Official checkout at the pinned revision')
    args = parser.parse_args()
    if args.source:
        prepare(args.source)
    else:
        validate()
