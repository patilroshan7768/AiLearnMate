import React from "react";
import AIToolsSection from "./AIToolsSection";

const AIToolsPanel = ({
  courseId,
  userId,
  activeToolTab,
  setActiveToolTab,
}) => {
  return (
    <AIToolsSection
      courseId={courseId}
      userId={userId}
      activeToolTab={activeToolTab}
      setActiveToolTab={setActiveToolTab}
    />
  );
};

export default AIToolsPanel;
