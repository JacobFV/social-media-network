import Context from "@/utils/context";

export function isAuthenticated(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return !!context.currentAuthenticatedUser;
  };
}

export function isAdmin(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return context.currentAuthenticatedUser.role === "admin";
  };
}

export function isAuthorizedWithRole(
  role: string
): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return context.currentAuthenticatedUser.role === role;
  };
}

export function isOwner(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
      return (
        const currentRecord = context.currentRecord;
        if (!currentRecord) {
        return false
        }
        if (!(currentRecord instanceof OwnedRecord)) {
        return false
        }
        context.currentAuthenticatedUser.id === currentRecord.ownerId
    );
  };
}

export function publicAccess(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return true;
  };
}

export function privateAccess(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return false;
  };
}
