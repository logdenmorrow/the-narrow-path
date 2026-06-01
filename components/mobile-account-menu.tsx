import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";

export default function MobileAccountMenu({
  signOutAction,
}: {
  signOutAction: ReactNode;
}) {
  return <AccountMenu signOutAction={signOutAction} />;
}
