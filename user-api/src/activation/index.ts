import { subscribeToEvent } from "../events/users";

export const waitForUserActivation = async (id: string) => {
  const activationEvent = await subscribeToEvent(id, "UserActivationFailed", "UserActivationSucceed")
  return activationEvent.type === "UserActivationSucceed"
}
