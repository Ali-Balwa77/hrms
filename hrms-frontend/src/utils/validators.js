import * as Yup from "yup";

export const generateSchema = (fields, mode) => {
  let shape = {};

  const getLabel = (field) => field.label || field.name;

  fields.forEach((field) => {
    let schema;

    switch (field.type) {
      case "email":
        schema = Yup.string()
        .matches(
          /\S+@\S+\.\S+/,
          `${getLabel(field)} is invalid`
        )
        .test(
          "lowercase-email",
          `${getLabel(field)} must be in lowercase`,
          (value) => {
            if (!value) return true;

            return value === value.toLowerCase();
          }
        );
        break;

      case "url":
        schema = Yup.string().matches(
          /^(https?:\/\/)?([\w-]+(\.[\w-]+)+\/?)/,
          `${getLabel(field)} is invalid`
        );
        break;

      case "number":
        schema = Yup.number().typeError(
          `${getLabel(field)} must be a number`
        );
        break;

      case "date":
        schema = Yup.date()
          .typeError(`${getLabel(field)} is invalid.`)
          .test(
            "valid-year",
            `${getLabel(field)} year must be 4 digits`,
            (value) => {
              if (!value) return true;

              const year = new Date(value).getFullYear();

              return year >= 1000 && year <= 9999;
            }
          );
        break;


      case "array":
        schema = Yup.array().of(Yup.string());
        break;


      case "multiselect":
        schema = Yup.array().of(
          Yup.object().shape({
            label: Yup.string().required(),
            value: Yup.string().required(),
          })
        );
        break;

      default:
        schema = Yup.string().transform((value) =>
          typeof value === "string" ? value.trim() : value
        );
    }


    if (field.required) {
      if (
        field.type === "array" ||
        field.type === "multiselect"
      ) {
        schema = schema
          .min(
            1,
            `Select at least one ${getLabel(field)}.`
          )
          .required(
            `${getLabel(field)} is required.`
          );
      } else {
        schema = schema.required(
          `${getLabel(field)} is required.`
        );
      }
    }

    if (field.integer) {
      schema = schema.integer(
        field.integerMessage || `${field.label || field.name} must be a whole number`
      );
    }

    if (field.type === "date") {

      if (field.minField) {
        schema = schema.min(
          Yup.ref(field.minField),
          `${getLabel(field)} must be after ${
            fields.find((f) => f.name === field.minField)?.label ||
            field.minField
          }.`
        );
      }


      if (field.name === "resumeDate") {
        schema = schema.test(
          "resume-date-after-to",
          "Resume Date is invalid based on selected leave session.",
          function (value) {
            const { to, isHalfDay, halfDayType } = this.parent;

            if (!value || !to) return true;

            const resumeDate = new Date(value);
            const leaveTo = new Date(to);

            resumeDate.setHours(0, 0, 0, 0);
            leaveTo.setHours(0, 0, 0, 0);


            if (
              isHalfDay &&
              halfDayType === "pre"
            ) {
              return resumeDate >= leaveTo;
            }


            if (
              isHalfDay &&
              halfDayType === "post"
            ) {
              return resumeDate > leaveTo;
            }


            return resumeDate > leaveTo;
          }
        );
      }

      if (field.name === "coffDate") {
        schema = schema.test(
          "coff-date-validation",
          "C/OFF can only be applied for the last 30 days.",
          function (value) {
            if (!value) return true;

            const selectedDate = new Date(value);
            const today = new Date();

            selectedDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);


            if (selectedDate >= today) {
              return this.createError({
                message:
                  "Current and future dates are not allowed in C/OFF Present Date.",
              });
            }


            const pastLimit = new Date(today);
            pastLimit.setDate(today.getDate() - 30);

            if (selectedDate < pastLimit) {
              return this.createError({
                message:
                  "C/OFF can only be applied for the last 30 days.",
              });
            }

            return true;
          }
        );
      }


      if (field.min) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        schema = schema.test(
          "not-in-past",
          `${getLabel(field)} cannot be in the past.`,
          (value) => {
            if (!value) return true;

            return new Date(value) >= today;
          }
        );
      }
    }

    if (field.name === "status") {
      schema = Yup.string()
        .trim()
        .required("Please select Decision Status.")
    }

    if (field.name === "mispunchOccurs") {
      schema = Yup.string()
        .trim()
        .oneOf(["pre", "post"], "Mispunch Occurs is invalid.")
        .required("Mispunch Occurs is required.");
    }

    if (field.name === "sanctionRemarks") {
      const hasStatusField = fields.some((f) => f.name === "status");

      if (hasStatusField) {
        schema = Yup.string()
          .trim()
          .when("status", {
            is: "rejected",
            then: (schema) =>
              schema.required("Decision remarks are required for rejection."),
            otherwise: (schema) => schema.notRequired(),
          });
      }
    }

    if (
      field.min &&
      field.type === "password"
    ) {
      schema = schema.min(
        field.min,
        `${getLabel(field)} must be at least ${field.min} characters.`
      );
    }


    if (
      field.oneOf &&
      typeof field.oneOf === "string"
    ) {
      schema = schema.oneOf(
        [Yup.ref(field.oneOf)],
        `Confirm Password does not match New Password.`
      );
    }

    if (field.pattern) {
      schema = schema.matches(
        field.pattern,
        field.patternMessage || `${getLabel(field)} is invalid`
      );
    }

    if (field.max && field.type !== "number") {
      schema = schema.max(
        field.max,
        `${getLabel(field)} cannot exceed ${field.max} characters`
      );
    }

    if (field.type === "number" && field.min !== undefined) {
      schema = schema.min(
        field.min,
        `${getLabel(field)} cannot be less than ${field.min}`
      );
    }

   if (
    field.type === "text" ||
    field.type === "email" ||
    field.name === "firstName" ||
    field.name === "lastName"
  ) {
    schema = schema.transform((value) =>
      typeof value === "string" ? value.trim() : value
    );
  }

  const keys = field.name.split(".");
    let current = shape;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = schema;
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    });
  });

  const buildNestedSchema = (obj) => {
    const newObj = {};

    Object.keys(obj).forEach((key) => {
      if (
        typeof obj[key] === "object" &&
        !obj[key].tests
      ) {
        newObj[key] = Yup.object().shape(
          buildNestedSchema(obj[key])
        );
      } else {
        newObj[key] = obj[key];
      }
    });

    return newObj;
  };

  let finalSchema = Yup.object().shape(buildNestedSchema(shape));

  const hasMispunchTimeFields =
    fields.some((field) => field.name === "startHour") &&
    fields.some((field) => field.name === "startMinute") &&
    fields.some((field) => field.name === "endHour") &&
    fields.some((field) => field.name === "endMinute");

  if (hasMispunchTimeFields) {
    finalSchema = finalSchema.test(
      "end-time-after-start-time",
      "End time must be greater than start time.",
      function (value) {
        if (!value) return true;

        const start =
          Number(value.startHour || 0) * 60 + Number(value.startMinute || 0);

        const end =
          Number(value.endHour || 0) * 60 + Number(value.endMinute || 0);

        if (end > start) return true;

        return this.createError({
          path: "endMinute",
          message: "End time must be greater than start time.",
        });
      }
    );
  }

  return finalSchema;
};
