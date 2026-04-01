const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Book = require('./models/Book');
const Coupon = require('./models/Coupon');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sellbookweb';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        await User.deleteMany({});
        await Category.deleteMany({});
        await Book.deleteMany({});
        await Coupon.deleteMany({});
        console.log('Cleared existing data');

        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@bookstore.com',
            password: 'admin123',
            role: 'ADMIN',
            active: true
        });
        console.log('Created admin user: admin@bookstore.com / admin123');

        const categories = await Category.insertMany([
            { name: 'Văn học', description: 'Sách văn học Việt Nam và thế giới', active: true },
            { name: 'Kinh tế', description: 'Sách về kinh tế, tài chính, kinh doanh', active: true },
            { name: 'Kỹ năng sống', description: 'Sách kỹ năng mềm, phát triển bản thân', active: true },
            { name: 'Học thuật', description: 'Sách giáo khoa, tham khảo', active: true },
            { name: 'Tiểu thuyết', description: 'Tiểu thuyết các thể loại', active: true }
        ]);
        console.log(`Created ${categories.length} categories`);

        const books = await Book.insertMany([
            {
                title: 'Nhà Giả Kim',
                author: 'Paulo Coelho',
                description: 'Tiểu thuyết nổi tiếng về hành trình theo đuổi giấc mơ',
                price: 85000,
                quantity: 50,
                categoryId: categories[4]._id,
                image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=250',
                rating: 4.5,
                publisher: 'NXB Văn Học',
                active: true
            },
            {
                title: 'Đắc Nhân Tâm',
                author: 'Dale Carnegie',
                description: 'Nghệ thuật thu phục lòng người',
                price: 95000,
                quantity: 30,
                categoryId: categories[2]._id,
                image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=250',
                rating: 4.8,
                publisher: 'NXB Tổng Hợp',
                active: true
            },
            {
                title: 'Rich Dad Poor Dad',
                author: 'Robert Kiyosaki',
                description: 'Dạy con làm giàu',
                price: 120000,
                quantity: 40,
                categoryId: categories[1]._id,
                image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=250',
                rating: 4.6,
                publisher: 'NXB Tài Chính',
                active: true
            },
            {
                title: 'Sapiens',
                author: 'Yuval Noah Harari',
                description: 'Lược sử loài người',
                price: 180000,
                quantity: 25,
                categoryId: categories[3]._id,
                image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=250',
                rating: 4.7,
                publisher: 'NXB Thế Giới',
                active: true
            },
            {
                title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
                author: 'Nguyễn Nhật Ánh',
                description: 'Tiểu thuyết tuổi thơ',
                price: 75000,
                quantity: 60,
                categoryId: categories[0]._id,
                image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=250',
                rating: 4.9,
                publisher: 'NXB Trẻ',
                active: true
            },
            {
                title: 'Mắt Biếc',
                author: 'Nguyễn Nhật Ánh',
                description: 'Truyện tình yêu tuổi học trò',
                price: 70000,
                quantity: 45,
                categoryId: categories[0]._id,
                image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=250',
                rating: 4.7,
                publisher: 'NXB Trẻ',
                active: true
            }
        ]);
        console.log(`Created ${books.length} books`);

        await Coupon.create({
            code: 'SALE10',
            description: 'Mã demo — giảm 10% trên phần đủ điều kiện',
            discountPercent: 10,
            active: true,
            scope: 'ALL',
            bookIds: []
        });
        console.log('Sample coupon: SALE10 (10%, tất cả sách)');

        console.log('\n✅ Seed completed!');
        console.log('Admin account: admin@bookstore.com / admin123');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
