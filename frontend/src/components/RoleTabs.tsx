import { NavLink } from "react-router-dom";

export function RoleTabs({ tabs }: { tabs: { to: string; label: string }[] }) {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `border-b-2 py-3 text-sm font-medium ${
                isActive ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
