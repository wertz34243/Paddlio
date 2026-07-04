export type IconName =
  | "home"
  | "training"
  | "trophy"
  | "chart"
  | "club"
  | "calendar"
  | "wallet"
  | "user"
  | "target"
  | "timer"
  | "bolt"
  | "boat"
  | "more";

type IconProps = {
  name: IconName;
  className?: string;
};

const paths: Record<IconName, string[]> = {
  home: ["M3 10.5 12 3l9 7.5", "M5 10v9h5v-5h4v5h5v-9"],
  training: ["M6 18V8", "M18 18V8", "M3 14h18", "M8 6h8"],
  trophy: ["M8 4h8v4a4 4 0 0 1-8 0V4Z", "M6 6H4v2a4 4 0 0 0 4 4", "M18 6h2v2a4 4 0 0 1-4 4", "M12 12v5", "M8 20h8"],
  chart: ["M4 19V5", "M4 19h16", "M8 15l3-4 3 2 4-7"],
  club: ["M4 21V8l8-5 8 5v13", "M9 21v-6h6v6", "M8 10h.01", "M12 10h.01", "M16 10h.01"],
  calendar: ["M7 3v4", "M17 3v4", "M4 8h16", "M5 5h14v15H5z"],
  wallet: ["M4 7h15a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12", "M16 13h4"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z", "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"],
  timer: ["M10 2h4", "M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z", "M12 10v4l3 2"],
  bolt: ["M13 2 4 14h7l-1 8 9-12h-7l1-8Z"],
  boat: ["M4 15c2 3 14 3 16 0", "M6 12h12l-2 4H8l-2-4Z", "M12 4v8"],
  more: ["M5 12h.01", "M12 12h.01", "M19 12h.01"],
};

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {paths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
