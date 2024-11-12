import { BentoDemo } from "@/components/BentoGrid";
import { Background } from "@/components/DotPattern";
import { GridPatternDemo } from "@/components/gridbackground";

import { NavbarDemo } from "@/components/Navbar";

export default function Home() {
  return (
    <div>
      <Background />
      <BentoDemo />
      <NavbarDemo />
      <GridPatternDemo />
    </div>);
}
