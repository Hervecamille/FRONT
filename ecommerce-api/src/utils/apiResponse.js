export const ok = (res, data = null, message = 'OK') =>
  res.status(200).json({ success: true, message, data });

export const created = (res, data = null, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res) => res.status(204).send();

export class ApiError extends Error {
  constructor(status = 500, message = 'Internal Server Error') {
    super(message);
    this.status = status;
  }
}
