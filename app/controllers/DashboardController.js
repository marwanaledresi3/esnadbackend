// controllers/DashboardController.js
const DashboardService = require('../services/DashboardService');

class DashboardController {
  static async getSummary(req, res) {
    try {
      const organizationId = req.user?.organization_id || null;
      const data = await DashboardService.getSummary(organizationId);
      return res.json({ success: true, data });
    } catch (error) {
      console.error('DashboardController.getSummary', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الإحصائيات',
      });
    }
  }
  static async getDashboard(req, res) {
    try {
      // req.user يأتي محمل البيانات والتصاريح من authMiddleware
      const dashboardData = await DashboardService.getDashboardData(req.user);

      return res.status(200).json({
        success: true,
        message: 'تم جلب بيانات لوحة التحكم بنجاح',
        data: dashboardData,
      });
    } catch (error) {
      console.error('Dashboard Fetch Error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب بيانات لوحة التحكم',
        error: error.message,
      });
    }
  }
}

module.exports = DashboardController;