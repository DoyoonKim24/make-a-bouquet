import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { faX } from "@fortawesome/free-solid-svg-icons";
import type { MouseEvent, ChangeEvent } from "react";

interface DropdownProps {
  options?: string[];
  placeholder?: string;
  rounded?: "none" | "left" | "right";
  selected: string[];
  setSelected: (selected: string[]) => void;
}

export function Dropdown({ options = [], placeholder, rounded = "none", selected, setSelected }: DropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o: string) =>
    o && o.toLowerCase().includes(query.toLowerCase())
  );


  return (
    <div className="relative flex flex-col w-full">
      <div
        tabIndex={0}
        // onBlur={() => {
        //   setOpen(false)
        // }}
        className={`${rounded === "left" && 'rounded-l-full'} ${rounded === "right" && 'rounded-r-full'} w-full flex justify-between items-center cursor-pointer 
          ${open ? "outline outline-blue-500 outline-2" : ""}`}
      >
        {selected.map((item, index) => (
          <div key={index} className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 mr-1 flex items-center gap-1">
            {item}
            <FontAwesomeIcon 
              icon={faX} 
              className="cursor-pointer hover:text-gray-200" 
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                const newSelected = selected.filter((_, i) => i !== index);
                setSelected(newSelected);
              }}
            />
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          placeholder= {placeholder}
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="w-full focus:outline-none px-4 py-2"
          onClick={() => setOpen(true)}
        />
        <div 
          className={`${open && "transform rotate-180"} px-4 py-2`}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </div>
      {open && (
        <div className="absolute top-full border border-gray-300 rounded bg-white z-10 mt-2">
          <ul>
            {filtered.map((opt) => (
              <li
                key={opt}
                onClick={() => {
                  setQuery("");
                  if (!selected.includes(opt)) {
                    setSelected([...selected, opt]);
                  }
                  setOpen(false);
                }}
                className="cursor-pointer hover:bg-gray-200 px-2 py-1"
              >
                {opt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
