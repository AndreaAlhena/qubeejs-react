/**
 * A parsed source file, as read by the repository convention checks.
 */
export type SourceFile = {
  declarations: SourceDeclaration[];
  name: string;
  path: string;
  text: string;
};

/**
 * A single top-level declaration found in a source file.
 */
export type SourceDeclaration = {
  exported: boolean;
  kind: string;
  name: string;
};
