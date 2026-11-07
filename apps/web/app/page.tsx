import RobotViewer from "@/components/robot/RobotViewer";
import StudioHeader from "@/components/studio/StudioHeader";

export default function Home() {
  return (
    <div className="studio">
      <StudioHeader />
      <main className="studio-main">
        <RobotViewer />
      </main>
      <footer className="studio-status technical">
        <span>Kinova Gen3 Lite · 6 DOF</span>
        <span>No physics</span>
        <span>No hardware</span>
      </footer>
    </div>
  );
}
