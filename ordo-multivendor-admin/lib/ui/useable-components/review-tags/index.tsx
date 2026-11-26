import {
  NEGATIVE_REVIEW_TAGS,
  reviewTagLabel,
} from '@/lib/utils/constants/review-tags';

// Small pills for the quick-tap feedback a customer picked; problems in red, praise in green.
export default function ReviewTags({
  tags,
  className = '',
}: {
  tags?: string[] | null;
  className?: string;
}) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${
            NEGATIVE_REVIEW_TAGS.has(tag)
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {reviewTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}
