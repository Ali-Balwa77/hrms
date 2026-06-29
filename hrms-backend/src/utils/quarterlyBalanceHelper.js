import Employee from "../models/Employee.js";

export const getCurrentQuarter = (date = new Date()) => {
  const month = date.getMonth() + 1;

  if (month >= 1 && month <= 3) return "Q1";
  if (month >= 4 && month <= 6) return "Q2";
  if (month >= 7 && month <= 9) return "Q3";

  return "Q4";
};

export const removeExpiredQuarterlyBalances = async () => {
  const today = new Date();
  const currentQuarter = getCurrentQuarter(today);
  const currentYear = today.getFullYear();

  const employees = await Employee.find();

  for (const emp of employees) {
    emp.leaveBalance = emp.leaveBalance.filter((x) => {
      if (x.allocationMode !== "quarterly") {
        return true;
      }

      return (
        x.quarter === currentQuarter &&
        Number(x.year) === Number(currentYear)
      );
    });

    await emp.save();
  }
};