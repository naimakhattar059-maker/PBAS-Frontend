import { CameraOutlined, LockOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Col, Form, Input, Modal, Row, Slider, Typography, message } from "antd";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changePassword, fetchProfile, updateProfile } from "../api/profile";
import { setAuth } from "../store/authSlice";
import { getCroppedCircleImage } from "../utils/cropImage";
import { getAvatarInitial } from "../utils/userAvatar";
import "./Settings.css";

const { Title, Text } = Typography;

const Settings = () => {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.attachment_image_data || null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const payload = await fetchProfile(token);
        dispatch(setAuth({ token, user: payload.user }));
        setAvatarPreview(payload.user.attachment_image_data || null);
        profileForm.setFieldsValue({
          username: payload.user.username,
          email: payload.user.email,
          father_name: payload.user.father_name,
          cnic: payload.user.cnic,
          department: payload.user.department,
          designation: payload.user.designation,
          role: payload.user.role?.replaceAll("_", " "),
        });
      } catch (err) {
        message.error(err.message || "Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [dispatch, profileForm, token]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setSelectedImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
    event.target.value = "";
  };

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const applyCroppedAvatar = async () => {
    if (!selectedImageSrc || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedCircleImage(selectedImageSrc, croppedAreaPixels);
      setAvatarPreview(croppedImage);
      setCropModalOpen(false);
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc(null);
    } catch {
      message.error("Could not crop image");
    }
  };

  const closeCropModal = () => {
    if (selectedImageSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    setCropModalOpen(false);
  };

  const handleProfileSubmit = async (values) => {
    setProfileSaving(true);
    try {
      const payload = await updateProfile(token, {
        username: values.username,
        email: values.email,
        father_name: values.father_name,
        cnic: values.cnic,
        department: values.department,
        designation: values.designation,
        attachment_image_data: avatarPreview,
      });

      dispatch(setAuth({ token, user: payload.user }));
      setAvatarPreview(payload.user.attachment_image_data || null);
      message.success("Profile updated");
    } catch (err) {
      message.error(err.message || "Could not update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    setPasswordSaving(true);
    try {
      const payload = await changePassword(token, values);
      dispatch(setAuth({ token: payload.token, user: payload.user }));
      passwordForm.resetFields();
      message.success(payload.message || "Password updated");
    } catch (err) {
      message.error(err.message || "Could not update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <Title level={3}>Profile Settings</Title>
          <Text type="secondary">Manage your profile details, photo, and password.</Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="settings-card" loading={loading}>
            <div className="profile-hero">
              <div className="profile-avatar-wrap">
                <Avatar
                  size={112}
                  src={avatarPreview || undefined}
                  className="profile-avatar"
                  onClick={openFilePicker}
                >
                  {getAvatarInitial(profileForm.getFieldValue("username") || user?.username)}
                </Avatar>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  className="avatar-camera"
                  onClick={openFilePicker}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelection}
                />
              </div>
              <div>
                <Title level={4}>{profileForm.getFieldValue("username") || user?.username || "User"}</Title>
                <Text type="secondary">Click the avatar or camera icon to upload a new profile photo.</Text>
              </div>
            </div>

            <Form form={profileForm} layout="vertical" onFinish={handleProfileSubmit}>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="User name" name="username" rules={[{ required: true, message: "Enter user name" }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Enter email" },
                      { type: "email", message: "Enter a valid email" },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Father name" name="father_name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="CNIC" name="cnic">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Designation" name="designation">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Department" name="department">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Role" name="role">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" size="small" htmlType="submit" loading={profileSaving}>
                Save profile
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="settings-card" title="Change Password" loading={loading}>
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
              <Form.Item
                label="Current password"
                name="current_password"
                rules={[{ required: true, message: "Enter current password" }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                label="New password"
                name="password"
                rules={[{ required: true, message: "Enter new password" }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                label="Re-enter password"
                name="password_confirmation"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Re-enter new password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Button type="primary" size="small" htmlType="submit" loading={passwordSaving}>
                Update password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Modal
        open={cropModalOpen}
        title="Crop profile photo"
        onCancel={closeCropModal}
        onOk={applyCroppedAvatar}
        okText="Use photo"
        destroyOnHidden
      >
        <div className="cropper-shell">
          <Cropper
            image={selectedImageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <div className="cropper-controls">
          <Text type="secondary">Zoom</Text>
          <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} />
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
