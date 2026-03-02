/**
 * Settings API Route
 * Handles user and company settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        language: true,
        autoEntrepreneur: true,
        defaultTvaRate: true,
        invoicePrefix: true,
        quotePrefix: true,
        creditNotePrefix: true,
        defaultCurrency: true,
        subscriptionPlan: true,
        companyName: true,
        companyIce: true,
        companyIf: true,
        companyRc: true,
        companyPatente: true,
        companyCnss: true,
        companyLegalForm: true,
        companyCapital: true,
        companyTvaNumber: true,
        companyAddress: true,
        companyCity: true,
        companyPhone: true,
        createdAt: true,
        company: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Separate user fields from company fields
    const {
      // User settings
      name,
      language,
      autoEntrepreneur,
      defaultTvaRate,
      invoicePrefix,
      quotePrefix,
      creditNotePrefix,
      defaultCurrency,
      // Company settings
      companyName,
      companyIce,
      companyIf,
      companyRc,
      companyPatente,
      companyCnss,
      companyLegalForm,
      companyCapital,
      companyTvaNumber,
      companyAddress,
      companyCity,
      companyPhone,
      // Full company object
      company
    } = body

    // Update user
    const userData: any = {}
    if (name !== undefined) userData.name = name
    if (language !== undefined) userData.language = language
    if (autoEntrepreneur !== undefined) userData.autoEntrepreneur = autoEntrepreneur
    if (defaultTvaRate !== undefined) userData.defaultTvaRate = parseFloat(defaultTvaRate)
    if (invoicePrefix !== undefined) userData.invoicePrefix = invoicePrefix
    if (quotePrefix !== undefined) userData.quotePrefix = quotePrefix
    if (creditNotePrefix !== undefined) userData.creditNotePrefix = creditNotePrefix
    if (defaultCurrency !== undefined) userData.defaultCurrency = defaultCurrency
    
    // Company fields on user
    if (companyName !== undefined) userData.companyName = companyName
    if (companyIce !== undefined) userData.companyIce = companyIce
    if (companyIf !== undefined) userData.companyIf = companyIf
    if (companyRc !== undefined) userData.companyRc = companyRc
    if (companyPatente !== undefined) userData.companyPatente = companyPatente
    if (companyCnss !== undefined) userData.companyCnss = companyCnss
    if (companyLegalForm !== undefined) userData.companyLegalForm = companyLegalForm
    if (companyCapital !== undefined) userData.companyCapital = companyCapital
    if (companyTvaNumber !== undefined) userData.companyTvaNumber = companyTvaNumber
    if (companyAddress !== undefined) userData.companyAddress = companyAddress
    if (companyCity !== undefined) userData.companyCity = companyCity
    if (companyPhone !== undefined) userData.companyPhone = companyPhone

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: userData,
      include: { company: true }
    })

    // Update company if provided
    if (company && updatedUser.company) {
      await prisma.company.update({
        where: { id: updatedUser.company.id },
        data: {
          name: company.name,
          ice: company.ice,
          ifNumber: company.ifNumber,
          rcNumber: company.rcNumber,
          patenteNumber: company.patenteNumber,
          cnssNumber: company.cnssNumber,
          tvaNumber: company.tvaNumber,
          legalForm: company.legalForm,
          capital: company.capital,
          address: company.address,
          city: company.city,
          postalCode: company.postalCode,
          phone: company.phone,
          email: company.email,
          website: company.website,
          bankName: company.bankName,
          bankAccount: company.bankAccount,
          bankRib: company.bankRib
        }
      })
    } else if (company && !updatedUser.company) {
      // Create company if doesn't exist
      await prisma.company.create({
        data: {
          ownerId: session.user.id,
          name: company.name || '',
          ice: company.ice,
          ifNumber: company.ifNumber,
          rcNumber: company.rcNumber,
          patenteNumber: company.patenteNumber,
          cnssNumber: company.cnssNumber,
          tvaNumber: company.tvaNumber,
          legalForm: company.legalForm,
          capital: company.capital,
          address: company.address,
          city: company.city,
          postalCode: company.postalCode,
          phone: company.phone,
          email: company.email,
          website: company.website,
          bankName: company.bankName,
          bankAccount: company.bankAccount,
          bankRib: company.bankRib
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'settings',
        details: 'Updated user/company settings'
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
