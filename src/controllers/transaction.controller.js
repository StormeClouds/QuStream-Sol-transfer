const transactionService = require('../services/transaction.service');

class TransactionController {
    async sendSol(req, res) {
        try {
            const { qcode, receiverWalletAddress, solAmount } = req.body;
            
            if (!qcode) {
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
            
           
            // Proceed with sending SOL only if QCode is confirmed and private key received
            const signature = await transactionService.sendSol(
                senderPrivateKey,
                receiverWalletAddress,
                solAmount
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
}




function extract_key_seed(){
	console.log("FUNCTION extract_key_seed");
	var xa = QS_Xv.substring(26,90);										// id-to-search
	var za = pi(QS_Zv.substring(32,38),16) % pi(QS_Zv.substring(0,2),16); 	// gap-between-end-id-and-first-sub
	var zb = pi(QS_Zv.substring(48,52),16) % pi(QS_Zv.substring(2,4),16); 	// len-of-subs
	var zc = pi(QS_Zv.substring(10,16),16) % pi(QS_Zv.substring(4,6),16); 	// gap-between-subs
	var zd = pi(QS_Zv.substring(18,24),16) % pi(QS_Zv.substring(6,8),16); 	// number-of-subs
	//console.log("xa(id-to-search) = "+xa);
	//console.log("za(gap-between-end-id-and-first-sub) = "+za);
	//console.log("zb(len-of-subs) = "+zb);
	//console.log("zc(gap-between-subs) = "+zc);
	//console.log("zd(number-of-subs) = "+zd);
	var qx = QuBlock.indexOf(xa)+xa.length;
	var zq = new Array(zd);
	var zt = qx+za;
	zq = QuBlock.substring(zt,zt+zb);
	zt += zb+zc;
	for(i = 1; i < zd; i++){
		zq += QuBlock.substring(zt,zt+zb);
		zt += zb+zc;
	}
	console.log("zq(extracted-key-seed) = "+zq);
	create_key(zq,zd,zb);
}
function create_key(zq,zd,zb){
	console.log("FUNCTION create_key");
	// convert hexstring to byte string
	var zqb = "";
	for(i=0; i < zq.length; i=i+2){
		zqb += String.fromCharCode(pi(zq.substring(i,i+1),16));
	}
	var zqc = "";
	for(i=0; i < zqb.length-100; i++){
		zqc += String.fromCharCode(zqb.charCodeAt(i) ^ zqb.charCodeAt(i+96));
	}
	var zqd = "";
	for(i=0; i < zqc.length-205; i++){
		zqd += String.fromCharCode(zqc.charCodeAt(i) ^ zqc.charCodeAt(i+201));
	}
	encrypt_post_variables(zqd);
}
function qu_decrypt(sCipherhex,sKey){
	console.log("FUNCTION qu_decrypt");
	console.log("sCipherhex = "+sCipherhex);
	var sCiphertext = "";
	for(i=0; i < sCipherhex.length; i=i+2){
		sCiphertext += String.fromCharCode(pi(sCipherhex.substring(i,i+2),16));
	}
	qs -= sCiphertext.length;
	var sPlaintext = "";
	for(i = 0; i < sCiphertext.length; i++){
		sPlaintext += String.fromCharCode(sCiphertext.charCodeAt(i) ^ sKey.charCodeAt(qs+i));
	}
	console.log("sCiphertext = "+sCiphertext);
	console.log("sPlaintext  = "+sPlaintext);
	return sPlaintext;
}












module.exports = new TransactionController(); 
