export const Skeleton = ({ className = "", count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-warm-grey/60 animate-pulse rounded-lg border border-warm-grey/40 ${className}`}
        />
      ))}
    </>
  );
};

export default Skeleton;
