import React from "react";
import tokens from "@/design/tokens.json";
import styles from "./Workspace.module.css";
export function WorkspaceFrame({ children }: {
    children: React.ReactNode;
}) {
    const vars = Object.fromEntries(Object.entries(tokens.workspace).map(([key, value]) => [`--ws-${key}`, value])) as React.CSSProperties;
    return <section className={styles.workspace} style={vars}>{children}</section>;
}
