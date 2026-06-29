import Employee from "../models/Employee.js";

export const removeExpiredQuarterlyBalances = async () => {
    const today = new Date();

    // આજની date start from 00:00:00
    today.setHours(0, 0, 0, 0);

    const result = await Employee.updateMany(
        {
            leaveBalance: {
                $elemMatch: {
                    allocationMode: "quarterly",
                    validTo: {
                        $lt: today,
                    },
                },
            },
        },
        {
            $pull: {
                leaveBalance: {
                    allocationMode: "quarterly",
                    validTo: {
                        $lt: today,
                    },
                },
            },
        }
    );

    return result;
};