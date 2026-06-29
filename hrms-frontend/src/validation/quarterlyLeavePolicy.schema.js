import * as Yup from 'yup';

export const quarterlyLeavePolicySchema = () =>
  Yup.object({
    policyName: Yup.string()
      .trim()
      .required('Policy Name is required.'),

    leaveType: Yup.string()
      .required('Leave Type is required.'),

    year: Yup.string()
    .required("Year is required.")
    .matches(/^\d{4}$/, "Year must be 4 digits")
    .test(
      "valid-year",
      "Year must be valid",
      (value) => {
        const year = Number(value);
        return year >= 2000 && year <= 9999;
      }
    ),

    quarter: Yup.string()
      .oneOf(['Q1', 'Q2', 'Q3', 'Q4'], 'Invalid quarter selected')
      .required('Quarter is required.'),

    leaveDays: Yup.number()
      .typeError('Leave Days must be a number')
      .required('Leave Days is required.')
      .moreThan(0, 'Leave Days must be greater than 0'),

    allocationType: Yup.string()
      .oneOf(['fixed', 'prorated', 'manual'], 'Invalid allocation type selected')
      .required('Allocation Type is required.'),

    carryForward: Yup.boolean(),
    status: Yup.boolean(),
  });
