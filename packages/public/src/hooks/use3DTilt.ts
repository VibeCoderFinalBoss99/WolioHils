import { useState } from "react";
import { useMotionValue, useSpring, useTransform } from "motion/react";

export function use3DTilt() {
  const [isHovering, setIsHovering] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const glareBackground = useTransform(
    [mouseXSpring, mouseYSpring],
    ([mx, my]) =>
      `radial-gradient(circle at ${((mx as number) + 0.5) * 100}% ${((my as number) + 0.5) * 100}%, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0) 70%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
    if (!isHovering) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    x.set(0);
    y.set(0);
  };

  return {
    isHovering,
    setIsHovering,
    rotateX,
    rotateY,
    glareBackground,
    handleMouseMove,
    handleMouseLeave,
    mouseXSpring,
    mouseYSpring,
  };
}
