import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  User,
  Shield,
  Bell,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Key,
  Lock,
  Check,
  X,
} from "lucide-react";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function AdminSettings() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [newLeadAlert, setNewLeadAlert] = useState(true);
  const [newQuoteAlert, setNewQuoteAlert] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      if (profile.notification_preferences) {
        const prefs = profile.notification_preferences;
        setEmailNotifications(prefs.email_notifications !== false);
        setWeeklyReport(prefs.weekly_report !== false);
        setNewLeadAlert(prefs.new_lead_alert !== false);
        setNewQuoteAlert(prefs.new_quote_alert !== false);
      }
    }
  }, [profile]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Password validation helpers
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    match: newPassword && confirmPassword && newPassword === confirmPassword,
  };

  const allPasswordChecksPass = Object.values(passwordChecks).every(Boolean);

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({ title: "Error", description: "Please enter your current password.", variant: "destructive" });
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (!allPasswordChecksPass) {
      toast({ title: "Error", description: "Please ensure all password requirements are met.", variant: "destructive" });
      return;
    }

    setPasswordChanging(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        return;
      }

      const resp = await fetch("/api/admin/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "change-password",
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({ title: "Password updated", description: "Your password has been changed successfully." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to update password.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: {
            email_notifications: emailNotifications,
            weekly_report: weeklyReport,
            new_lead_alert: newLeadAlert,
            new_quote_alert: newQuoteAlert,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast({ title: "Preferences saved", description: "Notification preferences updated successfully." });
    } catch (err) {
      toast({ title: "Error", description: err.message || "Failed to save preferences.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.full_name || user?.email || "A")
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const PasswordCheck = ({ passed, label }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <X className="w-3.5 h-3.5 text-gray-300" />
      )}
      <span className={passed ? "text-green-700" : "text-gray-500"}>{label}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, security, and notification preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-[#0A5C8C]" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar section */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || "Admin User"}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">Role: {profile?.role || "admin"}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Account Created</Label>
                <Input
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleProfileSave} disabled={saving} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-[#0A5C8C]" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Current Password */}
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Current Password
                </Label>
                <div className="relative mt-1.5">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, A-z, 0-9, !@#"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {newPassword && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Password Requirements
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <PasswordCheck passed={passwordChecks.length} label="At least 8 characters" />
                    <PasswordCheck passed={passwordChecks.uppercase} label="One uppercase letter" />
                    <PasswordCheck passed={passwordChecks.lowercase} label="One lowercase letter" />
                    <PasswordCheck passed={passwordChecks.number} label="One number" />
                    <PasswordCheck passed={passwordChecks.special} label="One special character" />
                    <PasswordCheck passed={passwordChecks.match} label="Passwords match" />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordChanging || !currentPassword || !allPasswordChecksPass}
                  className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
                >
                  {passwordChanging ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#0A5C8C]" />
                Login Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Session</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Logged in as {user?.email} &middot; Last sign-in: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0A5C8C]" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">Receive important updates and alerts via email.</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Weekly Report</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get a weekly summary of leads, traffic, and performance.</p>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Lead Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get notified when a new lead submits their email.</p>
                </div>
                <Switch checked={newLeadAlert} onCheckedChange={setNewLeadAlert} />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">New Quote Requests</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get notified when a business submits a quote request.</p>
                </div>
                <Switch checked={newQuoteAlert} onCheckedChange={setNewQuoteAlert} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleNotificationsSave} disabled={saving} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
