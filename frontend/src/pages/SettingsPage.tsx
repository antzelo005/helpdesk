import { AxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FormField } from "../components/ui/FormField";
import { InfoCard } from "../components/ui/InfoCard";
import { PageHeader } from "../components/ui/PageHeader";
import { TextInput } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { formatRoleLabel } from "../lib/format";

type ProfileForm = {
  email: string;
  first_name: string;
  last_name: string;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export function SettingsPage() {
  const { currentUser, refreshCurrentUser, setCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    email: currentUser?.email ?? "",
    first_name: currentUser?.first_name ?? "",
    last_name: currentUser?.last_name ?? "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setProfileForm({
      email: currentUser?.email ?? "",
      first_name: currentUser?.first_name ?? "",
      last_name: currentUser?.last_name ?? "",
    });
  }, [currentUser?.email, currentUser?.first_name, currentUser?.last_name]);

  const isProfileDirty =
    profileForm.email !== (currentUser?.email ?? "") ||
    profileForm.first_name !== (currentUser?.first_name ?? "") ||
    profileForm.last_name !== (currentUser?.last_name ?? "");

  const isPasswordInvalid =
    !passwordForm.current_password ||
    !passwordForm.new_password ||
    !passwordForm.confirm_password ||
    passwordForm.new_password !== passwordForm.confirm_password;

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setIsSavingProfile(true);

    try {
      const { data } = await api.patch("auth/me/", {
        email: profileForm.email.trim(),
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
      });
      setCurrentUser({
        id: data.id ?? currentUser?.id ?? 0,
        username: data.username ?? currentUser?.username ?? "",
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role ?? currentUser?.role ?? "CLIENT",
      });
      await refreshCurrentUser();
      showToast("Profile updated.", "success");
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? "Unable to update profile. Check the submitted values."
          : "Unable to update profile.";
      setProfileError(message);
      showToast(message, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      const message = "New password and confirmation must match.";
      setPasswordError(message);
      showToast(message, "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post("auth/change-password/", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      showToast("Password changed successfully.", "success");
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? "Unable to change password. Verify your current password and new password."
          : "Unable to change password.";
      setPasswordError(message);
      showToast(message, "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Settings"
        title="Profile and account security"
        description="Manage your personal details and password without changing your role or authentication flow."
        aside={
          <InfoCard
            label="Current role"
            value={formatRoleLabel(currentUser?.role ?? "CLIENT")}
            soft
            className="w-full min-w-52 px-5 py-5"
          />
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6 sm:p-8">
          <div>
            <p className="text-base font-semibold text-ink">Profile details</p>
            <p className="text-soft mt-2 text-sm leading-6">
              Username and role are read-only. Email and name fields sync with your current user record.
            </p>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard label="Username" value={currentUser?.username ?? "Unavailable"} soft />
            <InfoCard label="Role" value={formatRoleLabel(currentUser?.role ?? "CLIENT")} soft />
          </dl>

          <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="settings-first-name"
                label="First name"
              >
                <TextInput
                  id="settings-first-name"
                  value={profileForm.first_name}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, first_name: event.target.value }))
                  }
                  disabled={isSavingProfile}
                />
              </FormField>
              <FormField
                id="settings-last-name"
                label="Last name"
              >
                <TextInput
                  id="settings-last-name"
                  value={profileForm.last_name}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, last_name: event.target.value }))
                  }
                  disabled={isSavingProfile}
                />
              </FormField>
            </div>

            <FormField id="settings-email" label="Email">
              <TextInput
                id="settings-email"
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, email: event.target.value }))
                }
                disabled={isSavingProfile}
              />
            </FormField>

            {profileError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {profileError}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={!isProfileDirty || isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 sm:p-8">
          <div>
            <p className="text-base font-semibold text-ink">Change password</p>
            <p className="text-soft mt-2 text-sm leading-6">
              Use your current password to set a new one. Your role remains managed by the backend only.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handlePasswordSubmit}>
            <FormField id="settings-current-password" label="Current password">
              <TextInput
                id="settings-current-password"
                type="password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                }
                disabled={isChangingPassword}
              />
            </FormField>
            <FormField id="settings-new-password" label="New password">
              <TextInput
                id="settings-new-password"
                type="password"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, new_password: event.target.value }))
                }
                disabled={isChangingPassword}
              />
            </FormField>
            <FormField id="settings-confirm-password" label="Confirm new password">
              <TextInput
                id="settings-confirm-password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirm_password: event.target.value }))
                }
                disabled={isChangingPassword}
              />
            </FormField>

            {passwordForm.confirm_password &&
            passwordForm.new_password !== passwordForm.confirm_password ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Password confirmation does not match.
              </div>
            ) : null}

            {passwordError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {passwordError}
              </div>
            ) : null}

            <Button type="submit" fullWidth disabled={isPasswordInvalid || isChangingPassword}>
              {isChangingPassword ? "Updating..." : "Change password"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
