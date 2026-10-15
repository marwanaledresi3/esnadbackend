const { pool } = require('../config/db');

class Organization {
  static async create({ province_id, name, organization_type, organization_code, phone, address }, client = pool) {
    const query = `
      INSERT INTO organizations (province_id, name, organization_type, organization_code, phone, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;
    const res = await client.query(query, [province_id, name, organization_type, organization_code || null, phone || null, address || null]);
    return res.rows[0];
  }

  static async findAll() {
    const query = `SELECT * FROM organizations WHERE status = 'active' ORDER BY name ASC`;
    const res = await pool.query(query);
    return res.rows;
  }

   static async updateOrganizationStatus(organizationId, status) {
    const query = `
      UPDATE organizations
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const res = await pool.query(query, [status, organizationId]);
    return res.rows[0];
  }
  
  static async getOrganizations({ search, status, type }) {
    let query = `
      SELECT 
        o.id,
        o.name,
        o.organization_type,
        o.province_id,
        o.organization_code,
        o.status,
        o.created_at,
        (SELECT COUNT(*) FROM organization_memberships om WHERE om.organization_id = o.id AND om.status = 'active') AS active_members_count
      FROM organizations o
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND o.organization_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

   if (search) {
  query += ` AND o.province_id = $${paramIndex}`;
  params.push(search);
  paramIndex++;
}
    query += ` ORDER BY o.created_at DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
  }
   static async deleteOrganization(organizationId) {
    const query = `
      DELETE FROM organizations
      WHERE id = $1
      RETURNING *
    `;
    const res = await pool.query(query, [organizationId]);
    return res.rows[0];
  }
}

module.exports = Organization;