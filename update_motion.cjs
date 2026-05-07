const fs = require('fs');

const path = 'C:\\Users\\nurha\\hyecuts\\src\\MemberLounge.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Page load motion
content = content.replace(
  'transition={{ duration: 0.8 }}',
  'transition={{ duration: 0.4, ease: "easeOut" }}'
);

// 2. Update Reward Card stagger motion
content = content.replace(
  'transition={{ delay: idx * 0.15 }}',
  'transition={{ delay: idx * 0.2 }}'
);

// 3. Remove motion from Modal
content = content.replace(
  '<AnimatePresence>',
  ''
);
content = content.replace(
  '</AnimatePresence>',
  ''
);

// Replace motion.div with div in the modal
content = content.replace(
  '<motion.div\n            initial={{ opacity: 0 }}\n            animate={{ opacity: 1 }}\n            exit={{ opacity: 0 }}\n            className="fixed inset-0 z-50 flex items-center justify-center bg-studio-black/95 backdrop-blur-md p-6"\n          >',
  '<div className="fixed inset-0 z-50 flex items-center justify-center bg-studio-black/95 backdrop-blur-md p-6">'
);

content = content.replace(
  '<motion.div\n              initial={{ scale: 0.9, y: 20, opacity: 0 }}\n              animate={{ scale: 1, y: 0, opacity: 1 }}\n              exit={{ scale: 0.9, y: 20, opacity: 0 }}\n              transition={{ type: \'spring\', damping: 20, stiffness: 300 }}\n              className="bg-[#F9F9F7] w-full max-w-lg relative overflow-hidden shadow-2xl"\n              style={{ perspective: \'1000px\' }}\n            >',
  '<div className="bg-[#F9F9F7] w-full max-w-lg relative overflow-hidden shadow-2xl">'
);

content = content.replace(
  '</motion.div>\n          </motion.div>',
  '</div>\n          </div>'
);

// Remove motion.button from Modal
content = content.replace(
  /<motion\.button\s+whileTap={{ scale: 0\.98 }}\s+/g,
  '<button '
);
content = content.replace(
  /<\/motion\.button>/g,
  '</button>'
);

// Remove motion.button from Nav Header
content = content.replace(
  /<motion\.button\s+whileHover={{ x: -4 }}\s+/g,
  '<button '
);


fs.writeFileSync(path, content);
