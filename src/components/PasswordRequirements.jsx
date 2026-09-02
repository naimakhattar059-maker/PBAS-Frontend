import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { getPasswordChecks } from "../utils/authValidation";
import "./PasswordRequirements.css";

const PasswordRequirements = ({ value }) => {
  const checks = getPasswordChecks(value);

  return (
    <div className="password-requirements" aria-live="polite">
      {checks.map((check) => (
        <span
          className={`password-requirement ${check.valid ? "password-requirement-valid" : ""}`}
          key={check.key}
        >
          {check.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {check.label}
        </span>
      ))}
    </div>
  );
};

export default PasswordRequirements;
