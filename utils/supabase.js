//npm install @supabase/supabase-js
// import { createClient } from "@supabase/supabase-js";
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js');

dotenv.config({path:'./config.env'}); 

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Nome do bucket onde as imagens serão guardadas
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'works-images';

async function uploadImage(fileBuffer, fileName, folder = 'works'){
    try{
         // Cria o caminho onde a imagem será salva: ex: 'works/minhaFoto.png'
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Faz o upload da imagem
        const {data, error} = await supabase.storage
            .from(BUCKET_NAME)  // Escolhe o bucket
            .upload(filePath, fileBuffer, { // Diz que o conteúdo é uma imagem
                contentType: 'image/*', // Diz que o conteúdo é uma imagem
                cacheControl: '3600', // Cache por 1 hora
                upsert: false // Não sobrescreve se o arquivo existir
            });
        
        if (error) {
            throw new Error(`Erro ao fazer upload: ${error.message}`);
        }

        // Pega a URL pública da imagem enviada
        const {data: publicData} = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

        return publicData.publicUrl;

    }catch(error){
        console.error('Erro no upload:', error);
        throw error;
    }

}


async function deleteImage(imageUrl) {
  try {
    
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      throw new Error('URL inválida');
    }

    const filePath = urlParts[1];

    // Remove o arquivo do storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Erro ao deletar: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    throw error;
  }
}

module.exports = {
    supabase,
    uploadImage,
    deleteImage,
    BUCKET_NAME
};