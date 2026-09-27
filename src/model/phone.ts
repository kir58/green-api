export const normalizePhone = (input: string) => {
  return input.replace(/\D/g, '')
}

export const isValidPhone = (phone: string) => {
  return phone.length >= 11 && phone.length <= 15
}
