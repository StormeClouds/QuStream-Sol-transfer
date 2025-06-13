const transactionService = require('../services/transaction.service');

class TransactionController {
    async sendSol(req, res) {
        try {
            const { qcode, receiverWalletAddress, solAmount, qblock } = req.body;

            // Decryption logic
            var QuBlock = qblock.substring(16, 4096+16);
            var sKey = await TransactionController.get_key_from_qustream_node(qblock);
            console.log("sKey", sKey);
            var decrypted_qcode = TransactionController.qu_decrypt(qcode, sKey);
            console.log("decrypted_qcode", decrypted_qcode);
            var decrypted_receiverWalletAddress = TransactionController.qu_decrypt(receiverWalletAddress, sKey);
            var decrypted_solAmount = TransactionController.qu_decrypt(solAmount, sKey);
            console.log("decrypted_receiverWalletAddress", decrypted_receiverWalletAddress);
            console.log("decrypted_solAmount", decrypted_solAmount);
            // Continue with existing verification and transaction logic
            if (!decrypted_qcode) {
                throw new Error('QCode is required');
            }

            // Verify QCode and get sender private key from Supabase
            const response = await fetch('https://rclnhzbgzcvwykbvdlhm.supabase.co/functions/v1/verifyqcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbG5oemJnemN2d3lrYnZkbGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NTc3MTcsImV4cCI6MjA1NzEzMzcxN30.z52KTM55COCjTo3Tfso_fkuwRMOTammrbgHE6KJ1AhY`
                },
                body: JSON.stringify({ qcode: qcode })
            });
            console.log("response", response);
            if (!response.ok) {
                throw new Error('Failed to verify QCode');
            }
            const result = await response.json();


            if (!result) {
                throw new Error('QCode verification failed or private key not found');
            }
            // Extract the private key from the response
            const senderPrivateKey = result.private_key;

            //const receiverWalletAddress = '9zdJ128jEbG5MUM8eHPRAVQBZDiYywtNqixV6bdRnHGv';
            //const solAmount = 0.01; // Amount to send in SOL
            console.log("senderPrivateKey", senderPrivateKey);
            console.log("decrypted_receiverWalletAddress", decrypted_receiverWalletAddress);
            console.log("decrypted_solAmount", decrypted_solAmount);
            

            // Proceed with sending SOL only if QCode is confirmed and private key received
            const signature = await transactionService.sendSol(
                senderPrivateKey,
                decrypted_receiverWalletAddress,
                decrypted_solAmount
            );

            res.json({
                success: true,
                message: 'Transaction confirmed',
                signature: signature
            });
        } catch (error) {
            console.error('Error in sending transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Transaction failed',
                error: error.message
            });
        }
    }

    static async get_key_from_qustream_node(qblock) {
        try {
            return this.extract_key_seed();
        } catch (error) {
            console.error('Error in get_key_from_qustream_node:', error);
            return "";
        }
    }

    static extract_key_seed() {
    	var _QS_Xv = qblock.substring(0, 128);
    	var _QS_Zv = qblock.substring(128, 256);
        console.log("B _QS_Xv=",_QS_Xv);
        console.log("B _QS_Zv=",_QS_Zv);
    	var zqblock = qblock.substring(256, 4096+256);
        return B_extract_key_seed(zqblock, _QS_Xv, _QS_Zv);
    }
    
    function B_extract_key_seed(zqblock, _QS_Xv, _QS_Zv) {
      const pi = parseInt;
      const pd = "00";
      let qs = 41;
      const rf = 26, rg = 90, rh = 32, ri = 38, rj = 24, rk = 16, rm = 52;
      const rn = 10, rq = 48, rs = 4, rt = 6, rx = 2, rl = 18, rw = 0;
      var xa = _QS_Xv.substring(rf, rg);
      const za = pi(_QS_Zv.substring(rh, ri), rk) % pi(_QS_Zv.substring(rw, rx + rw), rk);
      const zb = pi(_QS_Zv.substring(rq, rm), rk) % pi(_QS_Zv.substring(rx, rx + rx), rk);
      const zc = pi(_QS_Zv.substring(rn, rk), rk) % pi(_QS_Zv.substring(rs, rs + rx), rk);
      const zd = pi(_QS_Zv.substring(rl, rj), rk) % pi(_QS_Zv.substring(rt, rs + rs), rk);
      const qx = zqblock.indexOf(xa) + xa.length;
      let zq = zqblock.substring(qx + za, qx + za + zb);
      let zt = qx + za + zb + zc;
      for (let i = 1; i < zd; i++) {
        zq += zqblock.substring(zt, zt + zb);
        zt += zb + zc;
      }
      return B_create_key(zq, zd, zb);
    }
    
    function B_create_key(zq, zd, zb) {
      let zqb = "", zqc = "", zqd = "", wa = 100, wb = wa + 105;
      for (let i = 0; i < zq.length; i += 2) {
        zqb += String.fromCharCode(pi(zq.substring(i, i + 1), 16));
      }
      for (let i = 0; i < zqb.length - wa; i++) {
        zqc += String.fromCharCode(zqb.charCodeAt(i) ^ zqb.charCodeAt(i + 96));
      }
      for (let i = 0; i < zqc.length - wb; i++) {
        zqd += String.fromCharCode(zqc.charCodeAt(i) ^ zqc.charCodeAt(i + 201));
      }
      return zqd;
    }
    
}

module.exports = new TransactionController();









