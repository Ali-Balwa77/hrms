import Employee from "../models/Employee.js";

const getProbationEndDate = (joinDate, probationPeriodMonths = 6) => {
  if (!joinDate || Number(probationPeriodMonths) <= 0) return null;

  const join = new Date(joinDate);
  const probationEndDate = new Date(Date.UTC(
    join.getUTCFullYear(),
    join.getUTCMonth(),
    join.getUTCDate()
  ));
  probationEndDate.setUTCMonth(probationEndDate.getUTCMonth() + Number(probationPeriodMonths));
  probationEndDate.setUTCDate(probationEndDate.getUTCDate() - 1);
  probationEndDate.setUTCHours(23, 59, 59, 999);

  return probationEndDate;
};

const getActualJoinDate = (probationEndDate) => {
  const actualJoinDate = new Date(probationEndDate);
  actualJoinDate.setUTCDate(actualJoinDate.getUTCDate() + 1);
  actualJoinDate.setUTCHours(0, 0, 0, 0);

  return actualJoinDate;
};

export const removeExpiredProbationBalances = async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const employees = await Employee.find({
    leaveBalance: {
      $elemMatch: {
        leaveType: "PROBATION",
        validTo: {
          $lt: today,
        },
      },
    },
  });

  let modifiedCount = 0;
  const processedEmployeeIds = new Set();

  for (const employee of employees) {
    processedEmployeeIds.add(String(employee._id));

    const expiredProbationBalances = employee.leaveBalance.filter(
      (balance) =>
        balance.leaveType === "PROBATION" &&
        balance.validTo &&
        new Date(balance.validTo) < today
    );

    if (!expiredProbationBalances.length) continue;

    const probationEndDate = expiredProbationBalances.reduce((latest, balance) => {
      const validTo = new Date(balance.validTo);
      return validTo > latest ? validTo : latest;
    }, new Date(expiredProbationBalances[0].validTo));

    employee.joinDate = getActualJoinDate(probationEndDate);
    employee.probationPeriodMonths = 0;
    employee.leaveBalance = employee.leaveBalance.filter(
      (balance) =>
        !(
          balance.leaveType === "PROBATION" &&
          balance.validTo &&
          new Date(balance.validTo) < today
        )
    );

    employee.markModified("leaveBalance");
    await employee.save();
    modifiedCount++;
  }

  const probationEmployees = await Employee.find({
    _id: {
      $nin: [...processedEmployeeIds],
    },
    employeeType: {
      $ne: "Admin",
    },
    joinDate: {
      $ne: null,
    },
    probationPeriodMonths: {
      $gt: 0,
    },
  });

  for (const employee of probationEmployees) {
    const probationEndDate = getProbationEndDate(
      employee.joinDate,
      employee.probationPeriodMonths
    );

    if (!probationEndDate || probationEndDate >= today) continue;

    employee.joinDate = getActualJoinDate(probationEndDate);
    employee.probationPeriodMonths = 0;
    employee.leaveBalance = employee.leaveBalance.filter(
      (balance) => balance.leaveType !== "PROBATION"
    );

    employee.markModified("leaveBalance");
    await employee.save();
    modifiedCount++;
  }

  return {
    matchedCount: employees.length + probationEmployees.length,
    modifiedCount,
  };
};
