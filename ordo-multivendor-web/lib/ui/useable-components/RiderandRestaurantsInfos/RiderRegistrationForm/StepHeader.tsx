"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

// numbered progress bar shared by the rider and merchant wizards
const StepHeader = ({ current, labels }: { current: number; labels: string[] }) => (
  <ol className="mb-6 flex items-center gap-2" aria-label="progress">
    {labels.map((label, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <li key={label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-center">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done || active
                  ? "bg-primary-color text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
            </span>
            {index < labels.length - 1 ? (
              <span
                className={`mx-1 h-0.5 flex-1 rounded ${
                  done ? "bg-primary-color" : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            ) : null}
          </div>
          <span
            className={`w-full text-start text-[11px] ${
              active
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "hidden text-gray-500 sm:block dark:text-gray-400"
            }`}
          >
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);

export default StepHeader;
