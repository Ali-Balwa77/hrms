import * as Yup from "yup";

export const roleSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required("Role name is required.")
    .min(2, "Role name must be at least 2 characters.")
    .max(50, "Role name cannot exceed 50 characters.")
    .matches(/^[A-Za-z0-9\s_-]+$/, "Role name can only contain letters, numbers, spaces, hyphen and underscore."),
  status: Yup.string().required("Status is required."),
  permissions: Yup.array()
    .of(
      Yup.object().shape({
        module: Yup.string().trim().required("Permission module is required."),
        actions: Yup.array()
          .of(Yup.string().trim())
          .min(1, "Select at least one action for the selected module."),
      })
    )
    .min(1, "Select at least one permission."),
});
