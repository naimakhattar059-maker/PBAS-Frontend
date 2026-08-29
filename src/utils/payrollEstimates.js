export const money = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK").format(Number(value || 0))}`;

export const calculatePayrollEstimate = (staff, year = new Date().getFullYear()) => {
  const basicPay = Number(staff?.monthly_basic_pay || staff?.basic_pay || 0);
  const incrementRate = Number(staff?.increment_rate || 0);
  const firstFourMonths = basicPay * 4;
  const nextEightMonths = basicPay * 8;
  const incrementSixMonths = incrementRate * 6;

  return {
    year: Number(year || new Date().getFullYear()),
    basicPay,
    incrementRate,
    incrementDate: staff?.next_increment_date || staff?.increment_date || "",
    firstFourMonths,
    nextEightMonths,
    incrementSixMonths,
    totalEstimatedSalary: firstFourMonths + nextEightMonths + incrementSixMonths,
  };
};
