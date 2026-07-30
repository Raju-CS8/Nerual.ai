// Mock auditLogService so this test never touches MongoDB — requireAdmin
// fires an audit log on denial, but that's a side effect we don't need
// a real DB connection to verify.
jest.mock('../services/auditLogService', () => ({
  logEvent: jest.fn().mockResolvedValue(undefined),
}))

const { requireAdmin } = require('../middleware/requireAdmin')
const auditLogService = require('../services/auditLogService')

const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('requireAdmin middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls next() when req.user.isAdmin is true', () => {
    const req = { user: { id: 'u1', isAdmin: true }, ip: '1.2.3.4', headers: {}, originalUrl: '/api/admin/overview' }
    const res = mockRes()
    const next = jest.fn()

    requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 403 and logs admin_access_denied when req.user.isAdmin is false', () => {
    const req = { user: { id: 'u2', isAdmin: false }, ip: '5.6.7.8', headers: {}, originalUrl: '/api/admin/overview' }
    const res = mockRes()
    const next = jest.fn()

    requireAdmin(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' })
    expect(auditLogService.logEvent).toHaveBeenCalledWith(
      'admin_access_denied',
      expect.objectContaining({ userId: 'u2', ipAddress: '5.6.7.8' })
    )
  })

  it('returns 403 when isAdmin is undefined (regular user, field never set)', () => {
    const req = { user: { id: 'u3' }, ip: '9.9.9.9', headers: {}, originalUrl: '/api/admin/overview' }
    const res = mockRes()
    const next = jest.fn()

    requireAdmin(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 401 when req.user is missing entirely (protect did not run first)', () => {
    const req = { headers: {} }
    const res = mockRes()
    const next = jest.fn()

    requireAdmin(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })
})