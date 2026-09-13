import { supabase } from './supabase'

const emailDomain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || '@students.satyaterrabhinneka.ac.id'

export { supabase }

/**
 * Validasi email kampus
 * Format: 2403310001@students.satyaterrabhinneka.ac.id
 */
export const isValidKampusEmail = (email: string): boolean => {
  const regex = /^[0-9]{10,}@students\.satyaterrabhinneka\.ac\.id$/i
  return regex.test(email.toLowerCase())
}

/**
 * Sign up dengan email kampus
 */
export const signUpWithKampusEmail = async (
  email: string,
  password: string,
  namaLengkap: string
) => {
  try {
    // Validasi email kampus
    if (!isValidKampusEmail(email)) {
      return {
        error: `Email harus menggunakan domain @students.satyaterrabhinneka.ac.id (contoh: 2403310001@students.satyaterrabhinneka.ac.id)`,
        data: null,
      }
    }

    // Sign up di Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: namaLengkap,
        },
      },
    })

    if (error) {
      return {
        error: error.message || 'Gagal membuat akun. Silakan coba lagi.',
        data: null,
      }
    }

    // Buat profil pengguna
    if (data.user) {
      const { error: profileError } = await supabase.from('profil_pengguna').insert([
        {
          user_id: data.user.id,
          nama_lengkap: namaLengkap,
          role: 'mahasiswa',
        },
      ])

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    return {
      error: null,
      data,
      message: 'Akun berhasil dibuat! Silakan cek email Anda untuk verifikasi.',
    }
  } catch (err) {
    return {
      error: 'Terjadi kesalahan. Silakan coba lagi.',
      data: null,
    }
  }
}

/**
 * Sign in dengan email kampus
 */
export const signInWithKampusEmail = async (email: string, password: string) => {
  try {
    if (!isValidKampusEmail(email)) {
      return {
        error: `Email harus menggunakan domain @students.satyaterrabhinneka.ac.id`,
        data: null,
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })

    if (error) {
      return {
        error: error.message || 'Email atau password salah.',
        data: null,
      }
    }

    return {
      error: null,
      data,
    }
  } catch (err) {
    return {
      error: 'Terjadi kesalahan. Silakan coba lagi.',
      data: null,
    }
  }
}

/**
 * Get user session saat ini
 */
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (err) {
    return null
  }
}

/**
 * Get profil pengguna dari database
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profil_pengguna')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (err) {
    return null
  }
}

/**
 * Sign out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return error
}

/**
 * Update password
 */
export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  return { data, error }
}

/**
 * Reset password (send email)
 */
export const resetPassword = async (email: string) => {
  if (!isValidKampusEmail(email)) {
    return {
      error: 'Email harus menggunakan domain @students.satyaterrabhinneka.ac.id',
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  return { error }
}
