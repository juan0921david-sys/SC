import supabase from '../config/supabase.js';

// ============================================
// FUNCIÓN: Generar plan de pagos
// ============================================
const generatePaymentPlan = (creditData) => {
    const {
        amount,
        interest_rate,
        number_of_installments,
        start_date,
        payment_frequency
    } = creditData;

    // Calcular cuota (interés simple)
    const monthlyInterest = interest_rate / 100;
    const totalInterest = amount * monthlyInterest * (number_of_installments / 12);
    const totalAmount = amount + totalInterest;
    const installmentAmount = totalAmount / number_of_installments;

    const installments = [];
    let currentDate = new Date(start_date);
    let remainingBalance = totalAmount;

    const frequencyMap = {
        'daily': 1,
        'weekly': 7,
        'biweekly': 15,
        'monthly': 30
    };

    const daysToAdd = frequencyMap[payment_frequency] || 30;

    for (let i = 1; i <= number_of_installments; i++) {
        const interest = remainingBalance * monthlyInterest / (12 / daysToAdd * 30);
        const principal = installmentAmount - interest;
        remainingBalance -= principal;

        installments.push({
            installment_number: i,
            due_date: new Date(currentDate),
            amount: Math.round(installmentAmount * 100) / 100,
            principal: Math.round(principal * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            balance: Math.round(remainingBalance * 100) / 100,
            status: 'pending'
        });

        currentDate.setDate(currentDate.getDate() + daysToAdd);
    }

    return {
        total_amount: Math.round(totalAmount * 100) / 100,
        installments
    };
};

// ============================================
// 1. REGISTRAR NUEVO CRÉDITO
// ============================================
export const createCredit = async (req, res) => {
    try {
        const {
            // Datos del cliente
            client_full_name,
            client_identification,
            client_phone,
            client_email,
            client_address,

            // Datos del codeudor
            guarantor_full_name,
            guarantor_identification,
            guarantor_phone,
            guarantor_email,

            // Datos del crédito
            amount,
            interest_rate,
            payment_frequency,
            number_of_installments,
            start_date,
            notes
        } = req.body;

        // ============================================
        // 1. VALIDACIONES
        // ============================================
        if (!client_full_name || !client_identification) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y cédula del cliente son requeridos'
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto del crédito es requerido'
            });
        }

        if (!payment_frequency || !['daily', 'weekly', 'biweekly', 'monthly'].includes(payment_frequency)) {
            return res.status(400).json({
                success: false,
                message: 'Frecuencia de pago inválida'
            });
        }

        if (!number_of_installments || number_of_installments <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Número de cuotas es requerido'
            });
        }

        // ============================================
        // 2. CREAR O RECUPERAR CLIENTE
        // ============================================
        let clientId;
        const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('identification', client_identification)
            .single();

        if (existingClient) {
            clientId = existingClient.id;
        } else {
            const { data: newClient, error: createClientError } = await supabase
                .from('clients')
                .insert([{
                    full_name: client_full_name,
                    identification: client_identification,
                    phone: client_phone || null,
                    email: client_email || null,
                    address: client_address || null
                }])
                .select()
                .single();

            if (createClientError) {
                console.error('Error creando cliente:', createClientError);
                return res.status(500).json({
                    success: false,
                    message: 'Error al crear el cliente'
                });
            }
            clientId = newClient.id;
        }

        // ============================================
        // 3. CREAR O RECUPERAR CODEUDOR
        // ============================================
        let guarantorId = null;
        if (guarantor_full_name && guarantor_identification) {
            const { data: existingGuarantor } = await supabase
                .from('guarantors')
                .select('id')
                .eq('identification', guarantor_identification)
                .single();

            if (existingGuarantor) {
                guarantorId = existingGuarantor.id;
            } else {
                const { data: newGuarantor, error: createGuarantorError } = await supabase
                    .from('guarantors')
                    .insert([{
                        full_name: guarantor_full_name,
                        identification: guarantor_identification,
                        phone: guarantor_phone || null,
                        email: guarantor_email || null
                    }])
                    .select()
                    .single();

                if (createGuarantorError) {
                    console.error('Error creando codeudor:', createGuarantorError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al crear el codeudor'
                    });
                }
                guarantorId = newGuarantor.id;
            }
        }

        // ============================================
        // 4. CALCULAR PLAN DE PAGOS
        // ============================================
        const creditData = {
            amount: parseFloat(amount),
            interest_rate: parseFloat(interest_rate) || 0,
            number_of_installments: parseInt(number_of_installments),
            start_date: start_date || new Date().toISOString().split('T')[0],
            payment_frequency
        };

        const paymentPlan = generatePaymentPlan(creditData);

        // ============================================
        // 5. CREAR CRÉDITO
        // ============================================
        const endDate = new Date(creditData.start_date);
        const frequencyMap = { 'daily': 1, 'weekly': 7, 'biweekly': 15, 'monthly': 30 };
        endDate.setDate(endDate.getDate() + (frequencyMap[payment_frequency] || 30) * number_of_installments);

        const { data: credit, error: createCreditError } = await supabase
            .from('credits')
            .insert([{
                client_id: clientId,
                guarantor_id: guarantorId,
                amount: parseFloat(amount),
                interest_rate: parseFloat(interest_rate) || 0,
                interest_type: 'simple',
                payment_frequency,
                number_of_installments: parseInt(number_of_installments),
                start_date: creditData.start_date,
                end_date: endDate.toISOString().split('T')[0],
                total_amount: paymentPlan.total_amount,
                status: 'active',
                created_by: req.user?.userId || null,
                notes: notes || null
            }])
            .select()
            .single();

        if (createCreditError) {
            console.error('Error creando crédito:', createCreditError);
            return res.status(500).json({
                success: false,
                message: 'Error al crear el crédito'
            });
        }

        // ============================================
        // 6. CREAR CUOTAS
        // ============================================
        const installmentsData = paymentPlan.installments.map(installment => ({
            credit_id: credit.id,
            installment_number: installment.installment_number,
            due_date: installment.due_date.toISOString().split('T')[0],
            amount: installment.amount,
            principal: installment.principal,
            interest: installment.interest,
            balance: installment.balance,
            status: 'pending'
        }));

        const { error: createInstallmentsError } = await supabase
            .from('installments')
            .insert(installmentsData);

        if (createInstallmentsError) {
            console.error('Error creando cuotas:', createInstallmentsError);
            return res.status(500).json({
                success: false,
                message: 'Error al crear las cuotas'
            });
        }

        // ============================================
        // 7. RESPUESTA
        // ============================================
        res.status(201).json({
            success: true,
            message: 'Crédito registrado exitosamente',
            data: {
                credit,
                installments: installmentsData,
                total_amount: paymentPlan.total_amount
            }
        });

    } catch (error) {
        console.error('Error en createCredit:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 2. OBTENER TODOS LOS CRÉDITOS
// ============================================
export const getAllCredits = async (req, res) => {
    try {
        const { data: credits, error } = await supabase
            .from('credits')
            .select(`
                *,
                clients:client_id (id, full_name, identification, phone, email),
                guarantors:guarantor_id (id, full_name, identification, phone, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo créditos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los créditos'
            });
        }

        res.json({
            success: true,
            data: credits
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 3. OBTENER CRÉDITO POR ID
// ============================================
export const getCreditById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: credit, error } = await supabase
            .from('credits')
            .select(`
                *,
                clients:client_id (*),
                guarantors:guarantor_id (*),
                installments (*)
            `)
            .eq('id', id)
            .single();

        if (error || !credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito no encontrado'
            });
        }

        res.json({
            success: true,
            data: credit
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============================================
// 4. OBTENER CRÉDITOS DE UN CLIENTE
// ============================================
export const getClientCredits = async (req, res) => {
    try {
        const { clientId } = req.params;

        const { data: credits, error } = await supabase
            .from('credits')
            .select(`
                *,
                installments (*)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo créditos del cliente:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los créditos del cliente'
            });
        }

        res.json({
            success: true,
            data: credits
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};