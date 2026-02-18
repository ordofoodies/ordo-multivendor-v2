// Interface
import { ICustomTabProps } from '@/lib/utils/interfaces';

const CustomTab = ({
  options,
  selectedTab,
  setSelectedTab,
}: ICustomTabProps) => {
  return (
    <div className="flex h-10 w-fit space-x-2 rounded bg-gray-100 dark:bg-dark-800 p-1">
      {options.map((option) => (
        <div
          key={String(option)}
          className={`flex cursor-pointer items-center justify-center rounded px-4 transition-colors ${
            selectedTab === option
              ? 'bg-orange-500 dark:bg-orange-600 text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
          onClick={() => setSelectedTab(option)}
        >
          {option}
        </div>
      ))}
    </div>
  );
};

export default CustomTab;
