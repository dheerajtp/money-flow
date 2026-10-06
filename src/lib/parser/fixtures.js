// Anonymized versions of real bank messages: digits, names and ids are made up.
export const UPI_SHOP = `Sent Rs.163.00
From HDFC Bank A/C *1234
To Test Vegetables
On 05/10/26
Ref 130000000001
Not You?
Call 18001234567/SMS BLOCK UPI to 7300000000`

export const UPI_PERSON = `Sent Rs.220.00
From HDFC Bank A/C *1234
To Test Person
On 05/10/26
Ref 130000000002
Not You?
Call 18001234567/SMS BLOCK UPI to 7300000000`

export const UPI_ID = `Sent Rs.1000.00
From HDFC Bank A/C *1234
To someone@okbank
On 29/09/26
Ref 620000000003
Not You?
Call 18001234567/SMS BLOCK UPI to 7300000000`

export const CRED_DEBIT = `Sent Rs.64398.00
From HDFC Bank A/C *1234
To CRED Club
On 05/10/26
Ref 130000000004
Not You?
Call 18001234567/SMS BLOCK UPI to 7300000000`

export const CARD_PAYMENT = 'DEAR HDFCBANK CARDMEMBER, PAYMENT OF Rs. 64398.00 RECEIVED TOWARDS YOUR CREDIT CARD ENDING WITH 9876 ON 5-10-2026.YOUR AVAILABLE LIMIT IS RS. 98238.52'

export const MANDATE = `E-Mandate!
Rs.219.00 will be deducted on 06/10/26, 00:00:00
For APPLE MEDIA SERVICES mandate
UMN 0000000000000000000000000000000a@oksbi
Maintain Balance
-HDFC Bank`

export const DEPOSIT = 'Update! INR 58,242.00 deposited in HDFC Bank A/c XX1234 on 05-OCT-26 for 000000000001.Avl bal INR 1,00,481.76. Cheque deposits in A/C are subject to clearing'

export const OTP = '123456 is your OTP for a transaction of Rs 500. Do not share it with anyone.'
export const PROMO = 'Congratulations! Get 10% cashback on your next order. Click here to apply.'
export const BALANCE_ONLY = 'Your A/c balance is INR 5,000.00. Avl bal INR 5,000.00'
export const GIBBERISH = 'Hello, your statement is ready to view.'

export const ALL = [UPI_SHOP, UPI_PERSON, UPI_ID, CRED_DEBIT, CARD_PAYMENT, MANDATE, DEPOSIT].join('\n\n\n')
