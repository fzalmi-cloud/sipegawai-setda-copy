import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    // Find all completed tickets that are not yet archived
    let archived = 0;
    let hasMore = true;
    let totalArchived = 0;

    while (hasMore) {
      const result = await base44.asServiceRole.entities.ServiceTicket.updateMany(
        { status: "Selesai", deleted: false },
        { $set: { deleted: true } }
      );

      // updateMany returns { matched, modified, has_more }
      totalArchived += result.modified || 0;
      hasMore = result.has_more === true;

      if (result.modified === 0) {
        break;
      }
    }

    // Log to audit
    if (totalArchived > 0) {
      await base44.asServiceRole.entities.AuditLog.create({
        user_id: user.id,
        nama_user: user.nama_lengkap || user.full_name || 'System',
        role_user: user.role,
        aksi: 'Auto-Archive Completed Tickets',
        modul: 'ServiceTicket',
        detail: `${totalArchived} tiket selesai otomatis dipindahkan ke arsip`,
        tanggal: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      archived_count: totalArchived,
      message: totalArchived > 0
        ? `${totalArchived} tiket selesai berhasil diarsipkan.`
        : 'Tidak ada tiket selesai yang perlu diarsipkan.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});