import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { nama_lengkap, nip, email, role, unit_id, nama_unit, jabatan, no_hp } = body;

    if (!nama_lengkap) return Response.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 });

    const finalEmail = email || `${nama_lengkap.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@setda.sumbarprov.go.id`;

    // Check for duplicate email
    const existing = await base44.asServiceRole.entities.User.filter({ email: finalEmail });
    if (existing.length > 0) {
      return Response.json({ error: 'Email sudah digunakan' }, { status: 409 });
    }

    // inviteUser is the only supported way to create users on Base44
    await base44.users.inviteUser(finalEmail, 'user');

    // Wait for the user record to propagate, then update custom fields
    let targetUser = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise(r => setTimeout(r, 1500));
      const matches = await base44.asServiceRole.entities.User.filter({ email: finalEmail });
      if (matches.length > 0) {
        targetUser = matches[0];
        break;
      }
    }

    if (!targetUser) {
      return Response.json({ 
        error: 'Pengguna berhasil diundang tetapi belum muncul di sistem. Pastikan aplikasi sudah dipublikasikan (Publish). Jika sudah, coba lagi dalam beberapa saat.' 
      }, { status: 500 });
    }

    // Update custom fields
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      role: role || 'pegawai',
      nama_lengkap,
      nip: nip || '',
      unit_id: unit_id || '',
      nama_unit: nama_unit || '',
      jabatan: jabatan || '',
      no_hp: no_hp || '',
      default_password: '12345678',
      password_changed: false,
    });

    return Response.json({ success: true, user_id: targetUser.id, email: finalEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});