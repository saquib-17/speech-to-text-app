export const Skeleton = ({ className = "", count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-[#F3EBFC]/70 animate-pulse rounded-xl border border-[#EBE8F0] ${className}`}
        />
      ))}
    </>
  );
};

export default Skeleton;
