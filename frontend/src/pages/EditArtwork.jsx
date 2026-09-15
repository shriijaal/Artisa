import { useParams } from 'react-router-dom';
import ArtworkForm from '../components/ArtworkForm';

const EditArtwork = () => {
  const { id } = useParams();
  return <ArtworkForm mode="edit" artworkId={id} />;
};

export default EditArtwork;
