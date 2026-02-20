const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('MongoDB Connected');

        const email = 'farmanraazi2006@gmail.com';
        const password = 'Raazi@26';

        let admin = await User.findOne({ role: 'admin' });

        if (admin) {
            console.log('Updating existing admin...');
            admin.email = email;
            admin.password = password; // Schema pre-save will hash this
            await admin.save();
            console.log('Admin updated successfully');
        } else {
            console.log('Creating new admin...');
            admin = new User({
                name: 'Farman Raazi',
                email,
                password,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created successfully');
        }

        console.log('Email:', email);
        console.log('Password:', password);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
