import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { User, Mail, Phone, Lock, Image, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '../components/UI.jsx';

export const Profile = () => {
  const { user, login } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      // Simulate profile details save
      const updatedUser = {
        ...user,
        name,
        email,
        phone,
        avatar
      };
      // Write back to mock auth session state
      localStorage.setItem('hms_auth_user', JSON.stringify(updatedUser));
      setSaving(false);
      toast.success('Your profile settings updated successfully!');
    }, 1000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.warning('Please enter current and new passwords.');
      return;
    }
    toast.success('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Staff Profile Settings</h1>
          <p className="text-slate-400 text-xs mt-1">Manage credentials, contact information, and upload profile photos.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Profile Summary Preview */}
        <div className="flex flex-col gap-4 select-none">
          <Card className="flex flex-col items-center text-center p-6">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
              alt={name}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-205 dark:border-slate-700 shadow-sm mb-4"
            />
            <h3 className="font-extrabold text-slate-850 dark:text-white text-base">{name || 'Clinical Staff'}</h3>
            <Badge variant="premium" className="mt-1.5 uppercase">{user?.role || 'Clinician'}</Badge>
            <p className="text-[10.5px] text-slate-405 mt-2">HEALTH HUB staff account active.</p>
          </Card>
        </div>

        {/* Right Columns Edit settings form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Update Profile Credentials" subtitle="Enter your contact parameters below.">
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={User}
                  required
                />
                <Input
                  label="Email Address"
                  id="p-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={Mail}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  id="p-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={Phone}
                  required
                />
                <Input
                  label="Profile Avatar URL"
                  id="p-avatar"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  icon={Image}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="flex justify-end mt-2 select-none">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Change Account Password" subtitle="Review security credentials block.">
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Current Password"
                  id="p-curpass"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  icon={Lock}
                  placeholder="••••••••"
                />
                <div className="relative">
                  <Input
                    label="New Password"
                    id="p-newpass"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    icon={Lock}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-600 cursor-pointer select-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-2 select-none">
                <Button type="submit" variant="secondary">
                  Update Security Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
