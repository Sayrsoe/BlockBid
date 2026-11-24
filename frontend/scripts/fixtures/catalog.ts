export const categories = Array.from({ length: 8 }, (_, index) => `group-${index + 1}`);

export const records = categories.flatMap((category, groupIndex) =>
  Array.from({ length: 3 }, (_, rowIndex) => {
    const id = groupIndex * 3 + rowIndex + 1;
    return { id, category, price: id * 2 };
  }),
);
