"use client";

import { useEffect, useRef, useState } from "react";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

// every error message in a (possibly nested) Formik errors object
const flattenErrors = (errors: unknown): string[] => {
  if (!errors) return [];
  if (typeof errors === "string") return [errors];
  if (Array.isArray(errors)) return errors.flatMap(flattenErrors);
  if (typeof errors === "object") return Object.values(errors as object).flatMap(flattenErrors);
  return [];
};

const HIGHLIGHT = ["ring-2", "ring-red-400", "ring-offset-2", "rounded-lg"];

// the field block around an error message (label + input + message)
const fieldBlockOf = (message: Element) =>
  (message.closest("[data-field]") as HTMLElement | null) ?? (message.parentElement as HTMLElement | null);

// Put inside a Formik <Form>. After a Continue/Submit that fails validation it
// scrolls to the first field with an error, highlights and focuses it, and
// lists what needs fixing right above the buttons.
export default function FormErrorFocus() {
  const t = useTranslations();
  const { submitCount, isSubmitting, isValidating, errors } = useFormikContext();
  const boxRef = useRef<HTMLDivElement>(null);
  const handledCount = useRef(0);
  const [showSummary, setShowSummary] = useState(false);

  const messages = Array.from(new Set(flattenErrors(errors)));

  const jumpTo = (index: number) => {
    const form = boxRef.current?.closest("form");
    const visible = Array.from(form?.querySelectorAll(".p-error") ?? []).filter(
      (el) => (el as HTMLElement).offsetParent !== null && el.textContent?.trim()
    );
    const target = visible[index] ?? visible[0];
    const block = target ? fieldBlockOf(target) : null;
    if (!block) {
      form?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    block.scrollIntoView({ behavior: "smooth", block: "center" });
    block.classList.add(...HIGHLIGHT);
    window.setTimeout(() => block.classList.remove(...HIGHLIGHT), 2200);
    const input = block.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button");
    // focus after the scroll so the browser doesn't jump again
    window.setTimeout(() => input?.focus({ preventScroll: true }), 400);
  };

  // a submit attempt just finished with errors
  useEffect(() => {
    if (isSubmitting || isValidating) return;
    if (submitCount === handledCount.current) return;
    handledCount.current = submitCount;
    if (!messages.length) return;
    setShowSummary(true);
    // wait for the error messages to render before looking for them
    requestAnimationFrame(() => requestAnimationFrame(() => jumpTo(0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount, isSubmitting, isValidating]);

  // hide once everything is fixed
  useEffect(() => {
    if (!messages.length) setShowSummary(false);
  }, [messages.length]);

  return (
    <div ref={boxRef} aria-live="assertive">
      {showSummary && messages.length ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <p className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faCircleExclamation} />
            {t("form_fix_errors_title", { count: messages.length })}
          </p>
          <ul className="mt-2 grid gap-1 ps-6">
            {messages.slice(0, 5).map((message, index) => (
              <li key={message} className="list-disc">
                <button type="button" onClick={() => jumpTo(index)} className="text-start underline-offset-2 hover:underline">
                  {message}
                </button>
              </li>
            ))}
            {messages.length > 5 ? <li className="list-none text-xs">{t("form_fix_errors_more", { count: messages.length - 5 })}</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
