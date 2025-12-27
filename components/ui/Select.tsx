
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  children: React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select: React.FC<SelectProps> = ({ label, children, value, onChange, className, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const scrollParentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectRef.current) {
        let parent = selectRef.current.parentElement;
        while (parent) {
            const { overflowY } = window.getComputedStyle(parent);
            if (overflowY === 'auto' || overflowY === 'scroll') {
                scrollParentRef.current = parent;
                break;
            }
            if (parent === document.body) break;
            parent = parent.parentElement;
        }
    }
  }, []);

  const handleOptionClick = useCallback((optionValue: string) => {
    if (value !== optionValue) {
      // Simulate the change event that the parent component expects
      const syntheticEvent = {
        target: { value: optionValue, name: props.name },
        currentTarget: { value: optionValue, name: props.name },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  }, [value, props.name, onChange]);
  
  // Find the label of the currently selected option
  const getDisplayLabel = useCallback(() => {
    let selectedLabel: React.ReactNode = '';
    let found = false;

    const findLabel = (nodes: React.ReactNode) => {
      React.Children.forEach(nodes, child => {
        if (found || !React.isValidElement(child)) return;

        if (child.type === 'optgroup') {
          const optgroupProps = child.props as React.ComponentProps<'optgroup'>;
          findLabel(optgroupProps.children);
        } else if (child.type === 'option') {
          const optionProps = child.props as React.ComponentProps<'option'>;
          const optionValue = optionProps.value ?? optionProps.children;
          if (String(optionValue) === String(value)) {
            selectedLabel = optionProps.children;
            found = true;
          }
        }
      });
    };

    findLabel(children);
    
    // If no matching option was found, display the value itself. This handles custom values.
    if (!found && (typeof value === 'string' || typeof value === 'number')) {
        return value;
    }

    return selectedLabel;
  }, [children, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        selectRef.current && !selectRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // max-h-96 is 24rem = 384px
      const dropdownHeight = dropdownRef.current?.offsetHeight || 384; 

      // Decide if we should render it above the button
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setDropdownStyle({
          position: 'fixed',
          bottom: `${window.innerHeight - rect.top + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        });
      } else {
        // Default to below
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        });
      }
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(prev => !prev);
  }, [isOpen, updateDropdownPosition]);
  
  // Reposition dropdown on scroll/resize to keep it attached to the button
  useEffect(() => {
    if (!isOpen) return;

    const handleEvents = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Hide if the button is off-screen
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
        } else {
          updateDropdownPosition();
        }
      }
    };

    const scrollableElement = scrollParentRef.current || window;
    scrollableElement.addEventListener('scroll', handleEvents, true);
    window.addEventListener('resize', handleEvents, true);

    return () => {
      scrollableElement.removeEventListener('scroll', handleEvents, true);
      window.removeEventListener('resize', handleEvents, true);
    };
  }, [isOpen, updateDropdownPosition]);
  
  // Map children to renderable option elements
  const renderOptions = (nodes: React.ReactNode): React.ReactNode[] => {
    return React.Children.map(nodes, child => {
        if (!React.isValidElement(child)) return null;

        if (child.type === 'optgroup') {
            const optgroupProps = child.props as React.ComponentProps<'optgroup'>;
            return (
                <div key={optgroupProps.label}>
                    <div className="px-3 py-2 text-xs font-semibold text-black uppercase tracking-wider select-none bg-gray-50/50 border-b border-gray-100">{optgroupProps.label}</div>
                    {renderOptions(optgroupProps.children)}
                </div>
            );
        }

        if (child.type === 'option') {
            const optionProps = child.props as React.ComponentProps<'option'>;
            const optionValue = optionProps.value ?? optionProps.children;
            const disabled = optionProps.disabled;

            if (disabled) {
                return (
                    <div
                        key={String(optionValue)}
                        className="px-3 py-2 text-sm text-text-secondary opacity-50 cursor-not-allowed"
                    >
                        {optionProps.children}
                    </div>
                );
            }
            
            const isSelected = String(value) === String(optionValue);
            return (
                <div
                    key={String(optionValue)}
                    onClick={() => handleOptionClick(String(optionValue))}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors rounded-md mx-1 my-0.5 ${
                        isSelected 
                        ? 'bg-primary text-white' 
                        : 'text-text-primary hover:bg-gray-100'
                    }`}
                     role="option"
                     aria-selected={isSelected}
                >
                    {optionProps.children}
                </div>
            );
        }
        return null;
    }) ?? [];
  }
  
  const handleWheel = (e: React.WheelEvent) => {
    const dropdown = dropdownRef.current;
    if (!dropdown) return;

    const isScrollable = dropdown.scrollHeight > dropdown.clientHeight;
    const isAtTop = dropdown.scrollTop === 0;
    const isAtBottom = dropdown.scrollTop >= dropdown.scrollHeight - dropdown.clientHeight - 1; // -1 for buffer

    // If not scrollable, or at the top and scrolling up, or at the bottom and scrolling down...
    if (!isScrollable || (e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        if (scrollParentRef.current) {
            // ...then forward the scroll event to the parent container.
            e.preventDefault();
            scrollParentRef.current.scrollTop += e.deltaY;
        }
    }
    // Otherwise, let the default wheel event scroll the dropdown itself.
  };

  const DropdownPortal = () => createPortal(
    <div 
        ref={dropdownRef}
        onWheel={handleWheel}
        className="fixed z-[70] bg-white/80 border border-border-light rounded-xl shadow-lg max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 backdrop-blur-md p-1"
        role="listbox"
        style={dropdownStyle}
    >
      {renderOptions(children)}
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <label className="block text-sm font-semibold text-black mb-1">{label}</label>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between px-3 py-2 bg-white text-text-primary border border-border-light rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm shadow-sm transition-shadow focus:shadow-md"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getDisplayLabel()}</span>
        <Icon name="chevron-down" className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && <DropdownPortal />}
    </div>
  );
};
