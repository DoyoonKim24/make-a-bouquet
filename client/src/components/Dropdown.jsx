import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { faX } from "@fortawesome/free-solid-svg-icons";

export function Dropdown({ options = [], placeholder, rounded = "none", selected, setSelected }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const filtered = options.filter(o =>
    o && o.toLowerCase().includes(query.toLowerCase())
  );

  console.log("selected flowers: ", selected)

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
              onClick={(e) => {
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
          onChange={(e) => setQuery(e.target.value)}
          className="w-full focus:outline-none px-4 py-2"
          onClick={() => setOpen(true)}
        />
        <div 
          className={`${open && "transform rotate-180"} px-4 py-2`}
          onClick={async (e) => {
            await e.stopPropagation();
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
                  setSelected(opt);
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
