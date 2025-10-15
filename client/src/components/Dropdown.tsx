import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { faX } from "@fortawesome/free-solid-svg-icons";
import type { MouseEvent, ChangeEvent } from "react";

interface DropdownOption {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface DropdownProps {
  options?: (string | DropdownOption)[];
  placeholder?: string;
  rounded?: "none" | "left";
  imageUsed?: boolean;
  selected: string[];
  setSelected: (selected: string[]) => void;
}

export function Dropdown({ options = [], placeholder, rounded = "none", imageUsed = false, selected, setSelected }: DropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when dropdown opens
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open && inputRef.current) {
      inputRef.current.focus();
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);
  

  const filtered = options.filter((o) => {
    const label = imageUsed ? (o as DropdownOption).name : (o as string);
    return label && label.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div ref={dropdownRef} className="relative flex flex-col h-full">
      <div
        tabIndex={0}
        onClick={() => setOpen(true)}
        className={`h-14 md:h-18 flex justify-between items-center cursor-pointer py-2 pl-4 pr-2 overflow-hidden
          ${rounded === "left" && "md:rounded-l-full"} ${open && "bg-hover"}`}
      >
        <div className="flex items-start gap-1 overflow-y-auto max-h-18 py-2 flex-1">
          {open || selected.length === 0 ? (
            <input
              ref={inputRef}
              type="text"
              placeholder={selected.length === 0 ? placeholder : "Search..."}
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              className="focus:outline-none flex-1 min-w-0 py-2 font-sweet font-medium text-base"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {selected.map((item, index) => (
                <div key={index} className="bg-green text-charcoal text-xs font-sweet font-semibold rounded-full px-2 py-1 flex items-center gap-1 flex-shrink-0">
                  {item}
                  <FontAwesomeIcon 
                    icon={faX} 
                    className="cursor-pointer hover:text-black" 
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      const newSelected = selected.filter((_, i) => i !== index);
                      setSelected(newSelected);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div 
          className={`${open && "transform rotate-180"} px-2 py-2`}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </div>
      {open && (
        imageUsed ? (
          <div className="absolute top-full border-2 border-wine rounded-lg bg-white z-10 mt-2 md:w-[30vw] md:min-w-[400px] overflow-hidden">
            {selected.length > 0 && (
              <>
                <div className="flex flex-wrap p-2 gap-2 bg-blush">
                  <p className="font-semibold">Selected:</p>
                  {selected.map((item, index) => (
                    <div key={index} className="bg-green text-charcoal text-xs font-sweet font-semibold rounded-full px-2 py-1 flex items-center gap-1 flex-shrink-0">
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
                </div>
                <hr className="border-wine border-1 mb-2"/>
              </>
            )}
            <div className="overflow-y-auto grid grid-cols-2 md:grid-cols-3 max-h-160">
              {filtered.map((opt) => {
                const option = opt as DropdownOption;
                const isSelected = selected.includes(option.name);
                return (
                  <div
                    key={option._id}
                    onClick={() => {
                      setQuery("");
                      if (!isSelected) {
                        setSelected([...selected, option.name]);
                      } else {
                        setSelected(selected.filter(item => item !== option.name));
                      }
                    }}
                    className={`cursor-pointer px-3 py-3 gap-1 flex flex-col border-gray-100 border-[0.25px] text-wrap break-words ${
                      isSelected
                        ? 'bg-green hover:bg-green/80'
                        : 'hover:bg-hover'
                    }`}
                  >
                    <img src={option.imageUrl} alt={option.name} className="inline-block w-full h-auto mr-2 object-cover rounded" />
                    <p className="font-semibold">{option.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="absolute top-full border-2 border-wine rounded-lg bg-white z-10 mt-2 w-full md:w-[16vw] md:min-w-[200px] overflow-hidden">
            {selected.length > 0 && (
              <>
                <div className="flex flex-wrap p-2 gap-2 bg-blush">
                  <p className="font-semibold">Selected:</p>
                  {selected.map((item, index) => (
                    <div key={index} className="bg-green text-charcoal text-xs font-sweet font-semibold rounded-full px-2 py-1 flex items-center gap-1 flex-shrink-0">
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
                </div>
                <hr className="border-wine border-1 mb-2"/>
              </>
            )}
            <div className="overflow-y-auto flex flex-col max-h-160">
              {filtered.map((opt) => {
                const option = opt as string;
                const isSelected = selected.includes(option);
                return (
                  <div
                    key={option}
                    onClick={() => {
                      setQuery("");
                      if (!isSelected) {
                        setSelected([...selected, option]);
                      } else {
                        setSelected(selected.filter(item => item !== option));
                      }
                    }}
                    className={`cursor-pointer px-3 py-2 gap-1 flex flex-col border-gray-100 border-[0.25px] text-wrap break-words ${
                      isSelected
                        ? 'bg-green hover:bg-green/80'
                        : 'hover:bg-hover'
                    }`}
                  >
                    <p className="font-semibold">{option}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
